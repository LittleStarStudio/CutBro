<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = ['app_name', 'app_website', 'app_logo_url'];
}
