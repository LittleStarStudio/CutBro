<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();                    // slug: free, pro, premium
            $table->string('display_name');                      // nama tampil: Free, Pro, Premium
            $table->unsignedInteger('price')->default(0);        // harga dalam Rupiah
            $table->text('description')->nullable();
            $table->unsignedInteger('max_barbers')->nullable();  // null = unlimited
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
