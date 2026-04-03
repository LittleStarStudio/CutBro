<?php

namespace App\Http\Controllers\Api;

use App\Services\BarbershopService;

class BarbershopController extends BaseController
{
    protected $barbershopService;

    public function __construct(BarbershopService $barbershopService)
    {
        $this->barbershopService = $barbershopService;
    }

    public function index()
    {
        $barbershops = $this->barbershopService->getAll();

        return $this->success($barbershops);
    }

    public function show($slug)
    {
        $barbershop = $this->barbershopService->getBySlug($slug);

        return $this->success($barbershop);
    }
}
