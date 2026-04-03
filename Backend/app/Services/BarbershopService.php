<?php

namespace App\Services;

use App\Models\Barbershop;

class BarbershopService
{
    public function getAll()
    {
        return Barbershop::where('status', 'active')
            ->select('id', 'name', 'slug', 'logo_url', 'city', 'phone')
            ->latest()
            ->get();
    }

    public function getBySlug(string $slug)
    {
        return Barbershop::where('slug', $slug)
            ->where('status', 'active')
            ->firstOrFail();
    }
}
