<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Isi data null yang ada dengan placeholder dulu agar tidak error
        DB::table('barbershops')
            ->whereNull('address')
            ->update(['address' => '-']);

        DB::table('barbershops')
            ->whereNull('city')
            ->update(['city' => '-']);

        Schema::table('barbershops', function (Blueprint $table) {
            $table->string('address')->nullable(false)->change();
            $table->string('city')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('barbershops', function (Blueprint $table) {
            $table->string('address')->nullable()->change();
            $table->string('city')->nullable()->change();
        });
    }

};
