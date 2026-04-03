<?php

namespace App\Http\Controllers\Api;

use App\Models\Barbershop;
use App\Models\BarbershopUserBlock;
use App\Models\LoginLog;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Str;

/**
 * @group Authentication
 *
 * Endpoint untuk autentikasi user:
 * - Login
 * - Register
 * - Google Login
 * - Logout
 * - Refresh Token
 */
class AuthController extends BaseController
{
    /**
     * Redirect ke Google OAuth
     *
     * @response 302
     */
    public function googleRedirect()
    {
        return Socialite::driver('google')->stateless()->redirect();
    }

    /**
     * Callback dari Google OAuth
     *
     * @response 200 {
     *   "access_token": "...",
     *   "refresh_token": "...",
     *   "token_type": "Bearer"
     * }
     */
    public function googleCallback()
    {
        if (!request()->has('code')) {
            $this->logLogin(null, null, 'failed', 'Google login cancelled', request());

            return response()->json([
                'success' => false,
                'message' => 'Login cancelled by user'
            ], 400);
        }

        $googleUser = Socialite::driver('google')->stateless()->user();

        $user = User::where('email', $googleUser->email)->first();

        if ($user && $user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Account is '.$user->status
            ], 403);
        }

        if ($user) {
            if (!$user->google_id) {
                $user->update([
                    'google_id' => $googleUser->id,
                    'provider' => 'google'
                ]);
            }
        } else {
            $customerRole = Role::where('name', 'customer')->first();

            if (!$customerRole) {
                return $this->error('Customer role not found', 500);
            }

            $user = User::create([
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'password' => bcrypt(Str::random(16)),
                'role_id' => $customerRole->id,
                'google_id' => $googleUser->id,
                'provider' => 'google'
            ]);

            $user->markEmailAsVerified();
        }

        $user->tokens()->delete();

        $deviceName = 'google-login';

        $accessToken = $user->createToken(
            $deviceName,
            [$user->role->name],
            now()->addMinutes(15)
        )->plainTextToken;

        $refreshToken = $user->createToken(
            $deviceName.'_refresh',
            ['refresh'],
            now()->addDays(7)
        )->plainTextToken;

        $this->logLogin(
            $user,
            $user->email,
            'google_login',
            'Login via Google',
            request()
        );

        return response()->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer'
        ]);
    }

    /**
     * Login user
     *
     * Endpoint untuk login user (owner / customer) dan menghasilkan token Sanctum.
     *
     * @group Authentication
     *
     * @bodyParam email string required Email user. Example: user@gmail.com
     * @bodyParam password string required Password user. Example: password123
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "token": "1|abcde...",
     *     "role": "customer",
     *     "user": {
     *       "id": 1,
     *       "name": "User",
     *       "email": "user@gmail.com"
     *     }
     *   }
     * }
     *
     * @response 401 {
     *   "success": false,
     *   "message": "Invalid credentials"
     * }
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        $user = User::where('email', $request->email)->first();

        // Cek status global
        if ($user && in_array($user->status, ['banned', 'suspended'])) {

            $this->logLogin(
                $user,
                $user->email,
                'failed',
                'Account '.$user->status,
                $request
            );

            return $this->error('Your account is '.$user->status, 403);
        }

        if ($user && $user->locked_until && now()->lessThan($user->locked_until)) {

            $this->logLogin(
                $user,
                $user->email,
                'locked',
                'Login attempt while locked',
                $request
            );

            return $this->error(
                'Account locked. Try again at '.$user->locked_until,
                423
            );
        }

        if (! Auth::attempt($request->only('email', 'password'))) {

            // Log login gagal
            $this->logLogin(
                $user,
                $request->email,
                'failed',
                'Wrong password',
                $request
            );

            if ($user) {
                // Use atomic increment to prevent race conditions
                DB::table('users')
                    ->where('id', $user->id)
                    ->increment('login_attempts');

                // Refresh user to get updated login_attempts count
                $user->refresh();

                if ($user->login_attempts >= 5) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update([
                            'locked_until' => now()->addMinutes(15)
                        ]);

                    // log account terkunci
                    $this->logLogin(
                        $user,
                        $request->email,
                        'locked',
                        'Too many attempts',
                        $request
                    );
                }
            }

            return $this->error('Invalid credentials', 401);
        }

        $user = Auth::user();

        $this->logLogin(
            $user,
            $user->email,
            'success',
            null,
            $request
        );

        // Reset login attempts and locked_until on successful login
        DB::table('users')
            ->where('id', $user->id)
            ->update([
                'login_attempts' => 0,
                'locked_until' => null,
                'last_login_at' => now(),
            ]);

        if (! $user->hasVerifiedEmail()) {
            return $this->error('Email not verified', 403);
        }

        // Cabut semua token lama (1 user = 1 session)
        $user->tokens()->delete();

        $deviceName = $request->header('User-Agent', 'unknown-device');

        // Menentukan abilities berdasarkan role
        $abilities = [$user->role->name];

        // Buat access token
        $accessToken = $user->createToken(
            $deviceName,
            $abilities,
            now()->addMinutes(15)
        )->plainTextToken;

        // Buat refresh token
        $refreshToken = $user->createToken(
            $deviceName.'_refresh',
            ['refresh'],
            now()->addDays(7)
        )->plainTextToken;

        return $this->success([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 15 * 60,
            'role' => $user->role,
            'user' => $this->sanitizeUser($user),
        ]);

    }

    /**
     * Refresh Access Token
     *
     * @bodyParam refresh_token string required Refresh token.
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "access_token": "...",
     *     "refresh_token": "...",
     *     "token_type": "Bearer"
     *   }
     * }
     */
    public function refresh(Request $request)
    {
        $request->validate([
            'refresh_token' => 'required'
        ]);

        $token = $request->input('refresh_token');

        // Pisah id|token
        if (!str_contains($token, '|')) {
            return $this->error('Invalid token format', 401);
        }

        [$id, $plainToken] = explode('|', $token, 2);

        $tokenModel = \Laravel\Sanctum\PersonalAccessToken::find($id);

        if (!$tokenModel) {
            return $this->error('Invalid refresh token', 401);
        }

        // Check hash
        if (! hash_equals($tokenModel->token, hash('sha256', $plainToken))) {
            return $this->error('Invalid refresh token', 401);
        }

        // Pastikan refresh token
        if (! in_array('refresh', $tokenModel->abilities ?? [])) {
            return $this->error('Invalid token type', 401);
        }

        // Expired cek
        if ($tokenModel->expires_at && now()->greaterThan($tokenModel->expires_at)) {
            $tokenModel->delete();
            return $this->error('Refresh token expired', 401);
        }

        $user = $tokenModel->tokenable;

        if($user->status !== 'active') {
            return $this->error('Account is '.$user->status, 403);
        }

        // Hapus access token lama
        $user->tokens()
            ->where('id', '!=', $tokenModel->id)
            ->delete();

        // Cretate access token baru
        $accessToken = $user->createToken(
            'access_token',
            [$user->role->name],
            now()->addMinutes(15)
        )->plainTextToken;

        // ROTATE refresh token 
        $tokenModel->delete();

        $newRefreshToken = $user->createToken(
            'refresh_token',
            ['refresh'],
            now()->addDays(7)
        )->plainTextToken;

        return $this->success([
            'access_token' => $accessToken,
            'refresh_token' => $newRefreshToken,
            'token_type' => 'Bearer',
            'expires_in' => 900
        ]);
    }

    /**
     * Forgot password
     *
     * Mengirim email reset password jika email terdaftar.
     * Response selalu sama untuk mencegah user enumeration.
     *
     * @group Authentication
     *
     * @bodyParam email string required Email user. Example: user@gmail.com
     *
     * @response 200 {
     *   "success": true,
     *   "data": "If the email exists, a reset link has been sent"
     * }
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return $this->success('Password reset link sent to your email');
        }

        // Apakah email ada / tidak
        return $this->success('If the email exists, a reset link has been sent');
    }

    /**
     * Reset password
     *
     * Endpoint untuk mengganti password menggunakan token reset.
     *
     * @group Authentication
     *
     * @bodyParam email string required Email user.
     * @bodyParam token string required Token reset dari email.
     * @bodyParam password string required Password baru.
     * @bodyParam password_confirmation string required Konfirmasi password.
     *
     * @response 200 {
     *   "success": true,
     *   "data": "Password reset successfully"
     * }
     *
     * @response 422 {
     *   "success": false,
     *   "message": "Invalid or expired token"
     * }
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6|confirmed',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => bcrypt($password),
                ])->save();

                // optional: revoke all tokens
                $user->tokens()->delete();
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->success('Password reset successfully');
        }

        return $this->error('Invalid or expired token', 422);
    }

    /**
     * Register owner
     *
     * Mendaftarkan user sebagai owner dan membuat barbershop.
     *
     * @group Authentication
     * @throttle 10,1 // Rate limit: 10 requests per minute
     *
     * @bodyParam name string required Nama owner.
     * @bodyParam email string required Email owner.
     * @bodyParam password string required Password.
     * @bodyParam barbershop_name string required Nama barbershop.
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "token": "1|abcde...",
     *     "role": "owner",
     *     "barbershop": {
     *       "id": 1,
     *       "name": "CutBro"
     *     }
     *   }
     * }
     */
    public function registerOwner(Request $request)
    {
        // Validasi
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'barbershop_name' => 'required|string|max:150',
        ]);

        // Check if owner role exists
        $role = Role::where('name', 'owner')->first();
        if (!$role) {
            return $this->error('Owner role not found', 500);
        }

        // Create barbershop
        $barbershop = Barbershop::create([
            'name' => $request->barbershop_name,
            'slug' => Str::slug($request->barbershop_name) . '-' . Str::random(5),
            'address' => '-',
            'city' => '-',
            'phone' => '-',
            'status' => 'active'
        ]);

        // Create barbershop owner
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role_id' => $role->id,
            'barbershop_id' => $barbershop->id
        ]);

        // Email verification
        $user->sendEmailVerificationNotification();

        return $this->success([
            'message' => 'Registration successful. Please verify your email and login.',
            'role' => $this->sanitizeRole($user->role),
            'user' => $this->sanitizeUser($user),
            'barbershop' => $barbershop
        ]);

    }

    /**
     * Register customer
     *
     * Mendaftarkan user sebagai customer dan mengirim email verifikasi.
     *
     * @group Authentication
     * @throttle 10,1 // Rate limit: 10 requests per minute
     *
     * @bodyParam name string required Nama lengkap. Example: Budi
     * @bodyParam email string required Email unik. Example: budi@gmail.com
     * @bodyParam password string required Password minimal 6 karakter.
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "token": "1|abcde...",
     *     "role": "customer",
     *     "user": {
     *       "id": 2,
     *       "email": "budi@gmail.com"
     *     }
     *   }
     * }
     */
    public function registerCustomer(Request $request)
    {
        // Validasi
        $request->validate([
            'name' => 'required|string|max:100',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6'
        ]);

        // Check if customer role exists
        $role = Role::where('name', 'customer')->first();
        if (!$role) {
            return $this->error('Customer role not found', 500);
        }

        // Create user / customer
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role_id' => $role->id,
            'barbershop_id' => null,
        ]);

        // Email verification
        $user->sendEmailVerificationNotification();

        return $this->success([
            'message' => 'Registration successful. Please verify your email and login.',
            'role' => $this->sanitizeRole($user->role),
            'user' => $this->sanitizeUser($user)
        ]);

    }

    /**
     * Get current user
     *
     * Mengambil data user yang sedang login.
     *
     * @group Authentication
     * @authenticated
     *
     * @response 200 {
     *   "success": true,
     *   "data": {
     *     "id": 1,
     *     "email": "user@gmail.com"
     *   }
     * }
     */
    public function me(Request $request)
    {
        if (!$request->user()) {
            return $this->error('Unauthenticated', 401);
        }

        return $this->success($this->sanitizeUser($request->user()));
    }

    /**
     * Logout current device
     *
     * @group Authentication
     * @authenticated
     */
    public function logout(Request $request)
    {
        if (!$request->user()) {
            return $this->error('Unauthenticated', 401);
        }

        $request->user()
                ->tokens()
                ->where('id', $request->user()->currentAccessToken()->id)
                ->delete();

        return $this->success('Logged Out');
    }

    /**
     * Logout all devices
     *
     * @group Authentication
     * @authenticated
     */
    public function logoutAll(Request $request)
    {
        $request->user()->tokens()->delete();

        return $this->success('Logged out from all devices');
    }

    /**
     * Histori login user
     *
     * @group Security
     * @authenticated
     */
    public function loginLogs(Request $request)
    {
        $user = $request->user();

        if (!in_array($user->role->name, ['super_admin', 'owner'])) {
            return $this->error('Forbidden', 403);
        }

        $query = LoginLog::with('user')->latest();

        if ($user->role->name === 'owner') {
            $query->whereHas('user', function ($q) use ($user) {
                $q->where('barbershop_id', $user->barbershop_id);
            });
        }

        if ($request->email) {
            $query->where('email', 'like', "%{$request->email}%");
        }

        return $this->success($query->paginate(20));
    }

    /**
     * Set password manual setelah login Google
     *
     * @authenticated
     *
     * @bodyParam password string required Password baru.
     * @bodyParam password_confirmation string required Konfirmasi password.
     */
    public function setPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|min:6|confirmed'
        ]);

        $user = $request->user();

        $user->update([
            'password' => bcrypt($request->password)
        ]);

        return $this->success('Password set successfully. You can now login manually.');
    }

    /**
     * Update user status (super_admin only)
     *
     * @group Authentication
     * @authenticated
     *
     * @bodyParam status string required Status user. Example: suspended
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,suspended,banned'
        ]);

        $user = User::findOrFail($id);

        if ($request->user()->role->name !== 'super_admin') {
            return $this->error('Forbidden', 403);
        }

        // Prevent changing super_admin status
        if ($user->role->name === 'super_admin') {
            return $this->error('Cannot change status of another super admin', 403);
        }

        // Prevent self-modification
        if ($user->id === $request->user()->id) {
            return $this->error('Cannot change your own status', 403);
        }

        $user->update([
            'status' => $request->status
        ]);

        return $this->success('User status updated');
    }

    /**
     * Owner memblokir user di barbershop
     *
     * @authenticated
     *
     * @bodyParam user_id int required ID user.
     * @bodyParam reason string optional Alasan blokir.
     */
    public function blockUser(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'reason' => 'nullable|string|max:500'
        ]);

        $owner = $request->user();

        if ($owner->role->name !== 'owner') {
            return $this->error('Forbidden', 403);
        }

        $targetUser = User::findOrFail($request->user_id);

        // Prevent blocking self
        if ($targetUser->id === $owner->id) {
            return $this->error('Cannot block yourself', 403);
        }

        // Prevent blocking super_admin or owner
        if (in_array($targetUser->role->name, ['super_admin', 'owner'])) {
            return $this->error('Cannot block admin or owner', 403);
        }

        // Prevent blocking users from other barbershops
        if ($targetUser->barbershop_id && $targetUser->barbershop_id !== $owner->barbershop_id) {
            return $this->error('Cannot block users from other barbershops', 403);
        }

        if ($targetUser->status !== 'active') {
            return $this->error('User already globally '.$targetUser->status, 400);
        }

        BarbershopUserBlock::updateOrCreate(
            [
                'barbershop_id' => $owner->barbershop_id,
                'user_id' => $request->user_id,
            ],
            [
                'status' => 'blocked',
                'reason' => $request->reason
            ]
        );

        return $this->success('User blocked in your barbershop');
    }

    /**
     * Log login attempt
     */
    private function logLogin($user, $email, $status, $reason = null, Request $request)
    {
        LoginLog::create([
            'user_id' => $user?->id,
            'email' => $email,
            'ip_address' => $request->ip(),
            'device' => $request->header('User-Agent'),
            'status' => $status,
            'reason' => $reason
        ]);
    }

    /**
     * Sanitize user data to hide sensitive fields
     */
    private function sanitizeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role->name,
            'barbershop_id' => $user->barbershop_id,
            'status' => $user->status,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];
    }

    /**
     * Sanitize role data to hide sensitive fields
     */
    private function sanitizeRole(Role $role): array
    {
        return [
            'id' => $role->id,
            'name' => $role->name,
        ];
    }
}
