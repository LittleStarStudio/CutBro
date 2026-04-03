<?php

use Illuminate\Support\Facades\Route;
use Dedoc\Scramble\Scramble;

// API Docs
Scramble::routes(function () {
    return Route::getRoutes();
});