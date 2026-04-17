<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AppSettingController extends BaseController
{
    public function index()
    {
        $setting = AppSetting::firstOrCreate(
            ['id' => 1],
            ['app_name' => 'CutBro', 'app_website' => null, 'app_logo_url' => null]
        );
        return $this->success([
            'app_name'     => $setting->app_name,
            'app_website'  => $setting->app_website,
            'app_logo_url' => $setting->app_logo_url
                              ? Storage::disk('public')->url($setting->app_logo_url)
                              : null,
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'app_name'    => 'nullable|string|max:100',
            'app_website' => 'nullable|string|url|max:255',
        ]);
        $setting = AppSetting::firstOrCreate(['id' => 1]);
        $setting->update($validated);
        return $this->success([
            'app_name'    => $setting->app_name,
            'app_website' => $setting->app_website,
        ]);
    }

    public function logo(Request $request)
    {
        $request->validate(['logo' => 'required|image|max:2048']);
        $setting = AppSetting::firstOrCreate(['id' => 1]);
        if ($setting->app_logo_url) {
            Storage::disk('public')->delete($setting->app_logo_url);
        }
        $path = $request->file('logo')->store('app_logos', 'public');
        $setting->update(['app_logo_url' => $path]);
        return $this->success([
            'app_logo_url' => Storage::disk('public')->url($path),
        ]);
    }
}
