<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTokenIsNotExpired
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->user()?->currentAccessToken();

        if ($token && $token->expires_at && now()->greaterThan($token->expires_at)) {
            $token->delete();

            return response()->json([
                'success' => false,
                'message' => 'Token expired'
            ], 401);
        }

        return $next($request);
    }
}