import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { NgApexchartsModule } from 'ng-apexcharts';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})

export class Dashboard implements OnInit {
  data!: Observable<any>;
  meta!: Observable<any>;
  courseProgress: any;
  metaCourseProgress: any;
  passStats: any;
  metaPassStats: any;
  gradeBreakdown: any;
  metaGradeBreakdown: any;
  districtRanking: any;
  metaDistrictRanking: any;
  assessmentCompletion: any;
  metaAssessmentCompletion: any;
  selectedYear: number = 2025;
  availableYears: number[] = [2023, 2024, 2025];
  selectedTheme: string = 'light';

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.data = this.http.get<any>(`assets/config/dashboard_${this.selectedYear}.json`);
    this.meta = this.http.get<any>('assets/config/metadata.json');
    this.meta.subscribe((metaData) => {
      this.metaCourseProgress = metaData.courseProgress;
      this.metaDistrictRanking = metaData.districtRanking;
      this.metaGradeBreakdown = metaData.gradeBreakdown;
      this.metaPassStats = metaData.passStats;
      this.metaAssessmentCompletion = metaData.assessmentCompletion;
    });
    this.data.subscribe((rawData) => {
      this.courseProgress = this.buildChart(rawData.courseProgress, this.metaCourseProgress);
      this.districtRanking = this.buildChart(rawData.districtRanking.districts, this.metaDistrictRanking);
      this.gradeBreakdown = this.buildChart(rawData.gradeBreakdown, this.metaGradeBreakdown);
      this.passStats = this.buildChart(this.covertObjToArr(rawData.passStats, this.metaPassStats), this.metaPassStats);
      this.assessmentCompletion = this.buildChart(this.covertObjToArr(rawData.assessmentCompletion, this.metaAssessmentCompletion), this.metaAssessmentCompletion);
    });
  }
  onYearChange(event: any) {
    this.selectedYear = event.target.value;
    this.data = this.http.get<any>(`assets/config/dashboard_${this.selectedYear}.json`);
  }
  onThemeChange(event: any) {
    const theme = event.target.value;
    this.selectedTheme = theme;
  }
  covertObjToArr(obj: any, meta: any) {
    return meta.dataFlds.map((field: any) => ({
      key: field.key,
      label: field.label,
      value: obj[field.key]
    }));
  }
  buildChart(data: any[], meta: any) {
    if(!meta || !data) return {};
    const isAxisChart = meta.chartType !== 'pie' && meta.chartType !== 'donut';
    const series = meta.isArrObjSeries
      ? meta?.series.map((m: any) => ({
        name: m.name,
        group: m.group,
        data: data.map(d => d[m.key])
      })) : isAxisChart ? [{ data: data.map(d => d[meta.seriesKey]) }] : data.map(d => d[meta.seriesKey]);

    return {
      series,
      chart: { type: meta.chartType, height: meta.height, width: meta.width,
        stacked: meta.stacked ?? false,
        toolbar: { show: false }
      },
      xaxis: isAxisChart ? { categories: data.map(d => d[meta.xAxisKey]) } : undefined,
      labels: !isAxisChart ? data.map(d => d[meta.labelKey]) : undefined,
      dataLabels: { enabled: meta.dataLabelEnabled ?? false, formatter: meta.dataLabelFormatter ? (val: any) => val + meta.dataLabelFormatter : undefined },
      legend: meta.legendPosition ? { position: meta.legendPosition, horizontalAlign: meta.legendAlign } : undefined,
      colors: meta.series?.map((m: any) => m.color),
      plotOptions: { bar: { horizontal: meta.isPlotBarHorizontal ?? false } },
    };
  }

}
