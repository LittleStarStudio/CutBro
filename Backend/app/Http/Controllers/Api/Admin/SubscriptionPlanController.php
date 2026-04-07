<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;

class SubscriptionPlanController extends BaseController
{
    public function index()
    {
        $plans = SubscriptionPlan::orderBy('price')->get();
        return $this->success($plans);
    }

    public function update(Request $request, SubscriptionPlan $plan)
    {
        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:100',
            'price'        => 'sometimes|integer|min:0',
            'description'  => 'sometimes|string|max:500',
        ]);

        $plan->update($validated);
        return $this->success($plan->fresh());
    }
}
