<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\BarbershopController;
use App\Http\Controllers\Api\Owner\ServiceCategoryController;
use App\Http\Controllers\Api\Owner\ServiceController;
use App\Http\Controllers\Api\Owner\BarberController;

use App\Http\Controllers\Api\Owner\BookingController as OwnerBookingController;
use App\Http\Controllers\Api\Customer\BookingController as CustomerBookingController;

use App\Http\Controllers\Api\Owner\ListBookingController as OwnerListBookingController;
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

    });
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

