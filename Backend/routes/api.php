<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\BarbershopController;

use App\Http\Controllers\Api\Owner\ServiceCategoryController;
use App\Http\Controllers\Api\Owner\ServiceController;
use App\Http\Controllers\Api\Owner\BarberController;
use App\Http\Controllers\Api\Owner\DashboardController as OwnerDashboardController;
use App\Http\Controllers\Api\Owner\BarbershopProfileController;
use App\Http\Controllers\Api\Owner\ShiftController as OwnerShiftController;
use App\Http\Controllers\Api\Owner\ShiftAssignmentController;
use App\Http\Controllers\Api\Owner\ScheduleController as OwnerScheduleController;
use App\Http\Controllers\Api\Owner\PromoController;
use App\Http\Controllers\Api\Owner\CustomerController as OwnerCustomerController;
use App\Http\Controllers\Api\Owner\PaymentSettingController;
use App\Http\Controllers\Api\Owner\TransactionController as OwnerTransactionController;
use App\Http\Controllers\Api\Owner\RefundController;
use App\Http\Controllers\Api\Owner\BarberReportController;
use App\Http\Controllers\Api\Owner\BookingController as OwnerBookingController;
use App\Http\Controllers\Api\Owner\ListBookingController as OwnerListBookingController;

use App\Http\Controllers\Api\Admin\BarbershopController as AdminBarbershopController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\LoginLogController as AdminLoginLogController;

use App\Http\Controllers\Api\Customer\BookingController as CustomerBookingController;
use App\Http\Controllers\Api\Customer\ListBookingController as CustomerListBookingController;

use App\Models\User;
use Illuminate\Http\Request;

// Users Verification (API)
/**
 * Verify email
 *
 * Endpoint untuk memverifikasi email user.
 *
 * @group Authentication
 *
 * @response 200 {
 *   "success": true,
 *   "message": "Email verified successfully"
 * }
 */
Route::get('/auth/verify-email/{id}/{hash}', function (Request $request, $id, $hash) {

    $user = User::findOrFail($id);

    // Validasi hash
    if (! hash_equals(
        sha1($user->getEmailForVerification()),
        $hash
    )) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid verification link'
        ], 403);
    }

    // Jika sudah diverifikasi
    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'success' => true,
            'message' => 'Email already verified'
        ]);
    }

    // Tandai verified
    $user->markEmailAsVerified();

    return response()->json([
        'success' => true,
        'message' => 'Email verified successfully'
    ]);

})->name('verification.verify');


// Users Auth
Route::prefix('auth')->group(function () {

   // Google
    Route::get('/google/redirect', [AuthController::class, 'googleRedirect'])
        ->middleware('throttle:10,1');
    Route::get('/google/callback', [AuthController::class, 'googleCallback'])
        ->middleware('throttle:10,1');

   // Login
    Route::post('/login',[AuthController::class,'login'])
        ->middleware('throttle:5,1');
    
    Route::post('/refresh', [AuthController::class,'refresh']);

    // Register
    Route::post('/register-owner', [AuthController::class,'registerOwner'])
        ->middleware('throttle:10,1');
    Route::post('/register-customer', [AuthController::class,'registerCustomer'])
        ->middleware('throttle:10,1');

    // Password forgot & reset
    Route::post('/forgot-password', [AuthController::class,'forgotPassword'])
        ->middleware('throttle:5,1');
    Route::post('/reset-password', [AuthController::class,'resetPassword'])
        ->middleware('throttle:10,1');

    // Profile (me), logout, logout all
    Route::middleware(['auth:sanctum', 'verified.api', 'token.expired'])->group(function(){

        Route::get('/me',[AuthController::class,'me']);
        Route::post('/logout',[AuthController::class,'logout']);
        Route::post('/logout-all', [AuthController::class,'logoutAll']);
        Route::post('/set-password', [AuthController::class,'setPassword']);

        Route::patch('/profile', [ProfileController::class,'update']);

        Route::post('/block-user', [AuthController::class,'blockUser']);
        Route::patch('/users/{id}/status', [AuthController::class,'updateStatus']);
        Route::get('/login-logs', [AuthController::class, 'loginLogs']);
    });

});

// Barbershop
Route::prefix('barbershops')->group(function () {
    Route::get('/', [BarbershopController::class, 'index']);
    Route::get('/{slug}', [BarbershopController::class, 'show']);
});

// Owner
Route::prefix('owner')->group(function () {
    
    Route::middleware(['auth:sanctum', 'verified.api', 'token.expired', 'role:owner'])->group(function () {

        // Service categories
        Route::get('/service-categories', [ServiceCategoryController::class, 'index']);
        Route::post('/service-categories', [ServiceCategoryController::class, 'store']);
        Route::put('/service-categories/{serviceCategory}', [ServiceCategoryController::class, 'update']);
        Route::delete('/service-categories/{serviceCategory}', [ServiceCategoryController::class, 'destroy']);

        // Services
        Route::get('/services', [ServiceController::class, 'index']);
        Route::post('/services', [ServiceController::class, 'store']);
        Route::put('/services/{service}', [ServiceController::class, 'update']);
        Route::delete('/services/{service}', [ServiceController::class, 'destroy']);

        // Barbers
        Route::get('/barbers', [BarberController::class, 'index']);
        Route::post('/barbers', [BarberController::class, 'store']);
        Route::put('/barbers/{barber}', [BarberController::class, 'update']);
        Route::delete('/barbers/{barber}', [BarberController::class, 'destroy']);

        // Bookings
        Route::get('/bookings', [OwnerListBookingController::class, 'index']);
        Route::patch('/bookings/{booking}/status', [OwnerBookingController::class, 'updateStatus']);

        // Dashboard stats
        Route::get('/dashboard', [OwnerDashboardController::class, 'stats']);

        // Barbershop profile + operational hours
        Route::get('/barbershop', [BarbershopProfileController::class, 'show']);
        Route::post('/barbershop', [BarbershopProfileController::class, 'update']);

        // Shifts (3 preset: morning, afternoon, evening)
        Route::get('/shifts', [OwnerShiftController::class, 'index']);
        Route::put('/shifts', [OwnerShiftController::class, 'upsert']);

        // Shift assignments (barber per hari)
        Route::get('/shift-assignments', [ShiftAssignmentController::class, 'index']);
        Route::post('/shift-assignments', [ShiftAssignmentController::class, 'store']);
        Route::put('/shift-assignments/{assignment}', [ShiftAssignmentController::class, 'update']);
        Route::delete('/shift-assignments/{assignment}', [ShiftAssignmentController::class, 'destroy']);

        // Schedule (attendance monitor — read-only)
        Route::get('/schedule', [OwnerScheduleController::class, 'index']);

        // Promos
        Route::get('/promos', [PromoController::class, 'index']);
        Route::post('/promos', [PromoController::class, 'store']);
        Route::put('/promos/{promo}', [PromoController::class, 'update']);
        Route::delete('/promos/{promo}', [PromoController::class, 'destroy']);

        // Customers
        Route::get('/customers', [OwnerCustomerController::class, 'index']);
        Route::patch('/customers/{user}/status', [OwnerCustomerController::class, 'updateStatus']);

        // Payment settings
        Route::get('/payment-settings', [PaymentSettingController::class, 'show']);
        Route::put('/payment-settings', [PaymentSettingController::class, 'upsert']);

        // Transactions
        Route::get('/transactions', [OwnerTransactionController::class, 'index']);

        // Refunds
        Route::get('/refunds', [RefundController::class, 'index']);
        Route::patch('/refunds/{booking}/status', [RefundController::class, 'updateStatus']);

        // Barber report
        Route::get('/barbers/report', [BarberReportController::class, 'index']);

    });
});

// Admin
Route::prefix('admin')->middleware(['auth:sanctum', 'verified.api', 'token.expired', 'role:super_admin'])->group(function () {

    // Barbershop management
    Route::get('/barbershops/stats', [AdminBarbershopController::class, 'stats']);
    Route::get('/barbershops', [AdminBarbershopController::class, 'index']);
    Route::put('/barbershops/{id}', [AdminBarbershopController::class, 'update']);
    Route::delete('/barbershops/{id}', [AdminBarbershopController::class, 'destroy']);

    // User management
    Route::get('/users/stats', [AdminUserController::class, 'stats']);
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::put('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

    // Login Log management
    Route::get('/login-logs/stats', [AdminLoginLogController::class, 'stats']);
    Route::get('/login-logs', [AdminLoginLogController::class, 'index']);


});

// Customer
Route::prefix('customer')->group(function () {

    Route::middleware(['auth:sanctum','verified.api','token.expired','role:customer'])->group(function () {

        // Bookings
        Route::post('/bookings', [CustomerBookingController::class,'store']);

        // Bookings cancel
        Route::patch('/bookings/{booking}/cancel', [CustomerBookingController::class, 'cancel']);

        // Available time slots (STEP SLOT SYSTEM)
        Route::get('/available-slots', [CustomerBookingController::class, 'availableSlots']);

        // My booking lists
        Route::get('/bookings', [CustomerListBookingController::class, 'index']);
    });

});

