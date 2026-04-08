<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refund_requests', function (Blueprint $table) {
            $table->id();
            $table->enum('transaction_type', ['subscription', 'booking']);
            $table->foreignId('owner_subscription_id')
                  ->nullable()
                  ->constrained('owner_subscriptions')
                  ->nullOnDelete();
            $table->foreignId('payment_id')
                  ->nullable()
                  ->constrained('payments')
                  ->nullOnDelete();
            $table->foreignId('barbershop_id')
                  ->constrained('barbershops')
                  ->cascadeOnDelete();
            $table->foreignId('requested_by')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->text('reason');
            $table->decimal('refund_amount', 12, 2);
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('admin_note')->nullable();
            $table->foreignId('processed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('refund_requests');
    }
};
