<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('operational_hours', function (Blueprint $table) {
            $table->id();

            // Relasi ke barbershop (multi-tenant)
            $table->foreignId('barbershop_id')->constrained()->cascadeOnDelete();

            // 0 = Sunday, 1 = Monday, ... 6 = Saturday
            $table->tinyInteger('day_of_week');

            // Jam buka & tutup
            $table->time('open_time')->nullable();
            $table->time('close_time')->nullable();

            // Jika toko tutup di hari itu
            $table->boolean('is_closed')->default(false);

            $table->timestamps();

            // 1 barbershop hanya punya 1 config per hari
            $table->unique(['barbershop_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('operational_hours');
    }
};
