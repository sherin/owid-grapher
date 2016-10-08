<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use App\Chart;

class ScatterplotTimeline extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Let's push time from chart-dimensions onto chart-time, since we're going
        // to add timeline sliders to scatterplots
        DB::transaction(function() {
            $charts = Chart::all();
            foreach ($charts as $chart) {                
                if ($chart->type != "ScatterPlot") continue;
                $targetYear = +$chart->dimensions()->first()->targetYear;
                var_dump($targetYear);
                $config = json_decode($chart->config);
                $config->{'chart-time'} = [$targetYear, $targetYear];
                $chart->config = json_encode($config);
                $chart->save();
            }
        });    
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
