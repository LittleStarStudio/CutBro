<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('owner_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();
            $table->foreignId('plan_id')->constrained('subscription_plans');
            $table->enum('status', ['active', 'expired', 'cancelled'])->default('active');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('expired_at')->nullable();   // null = Free (tidak ada expiry)
            $table->string('midtrans_order_id')->nullable()->unique();
            $table->string('midtrans_snap_token')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('owner_subscriptions');
    }
};
