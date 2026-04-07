<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('barbershops', function (Blueprint $table) {
            $table->dropUnique('barbershops_phone_unique');
            $table->string('phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('barbershops', function (Blueprint $table) {
            $table->string('phone')->nullable(false)->change();
            $table->unique('phone');
        });
    }
};
