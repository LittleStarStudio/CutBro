<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Models\LoginLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class LoginLogController extends BaseController
{
    public function stats()
    {
        $since = Carbon::now()->subDays(30);

        return $this->success([
            'login'    => LoginLog::where('action', 'login')
                            ->whereIn('status', ['success', 'google_login'])
                            ->where('created_at', '>=', $since)->count(),
            'logout'   => LoginLog::where('action', 'logout')
                            ->where('created_at', '>=', $since)->count(),
            'register' => LoginLog::where('action', 'register')
                            ->where('created_at', '>=', $since)->count(),
            'total'    => LoginLog::where('created_at', '>=', $since)->count(),
        ]);
    }

    public function index(Request $request)
    {
        $logs = LoginLog::with('user')
            ->latest()
            ->paginate(min((int) $request->get('per_page', 10), 500));

        return $this->success([
            'data' => $logs->map(fn($l) => [
                'id'        => $l->id,
                'user'      => $l->user?->name ?? '-',
                'email'     => $l->email ?? '-',
                'action'    => $l->action ?? 'login',
                'timestamp' => $l->created_at?->format('Y-m-d H:i:s'),
                'ipAddress' => $l->ip_address ?? '-',
                'location'  => $l->location ?? '-',
                'device'    => $this->parseDevice($l->device),
                'status'    => in_array($l->status, ['success', 'google_login']) ? 'success' : 'failed',
            ]),
            'current_page' => $logs->currentPage(),
            'last_page'    => $logs->lastPage(),
            'per_page'     => $logs->perPage(),
            'total'        => $logs->total(),
        ]);
    }

    private function parseDevice(?string $ua): string
    {
        if (!$ua) return '-';

        $browser = match(true) {
            str_contains($ua, 'Edg')                                      => 'Edge',
            str_contains($ua, 'OPR') || str_contains($ua, 'Opera')       => 'Opera',
            str_contains($ua, 'Chrome') && !str_contains($ua, 'Chromium') => 'Chrome',
            str_contains($ua, 'Firefox')                                  => 'Firefox',
            str_contains($ua, 'Safari') && !str_contains($ua, 'Chrome')  => 'Safari',
            default                                                        => 'Browser',
        };

        $os = match(true) {
            str_contains($ua, 'iPhone')  => 'iPhone',
            str_contains($ua, 'iPad')    => 'iPad',
            str_contains($ua, 'Android') => 'Android',
            str_contains($ua, 'Windows') => 'Windows',
            str_contains($ua, 'Mac OS')  => 'macOS',
            str_contains($ua, 'Linux')   => 'Linux',
            default                       => 'Device',
        };

        return "{$browser} on {$os}";
    }

}
