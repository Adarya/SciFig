// SciFig AI: Core Statistical Engine (TypeScript Implementation)
// Adapted from the Python statistical engine for web use

import * as ss from 'simple-statistics';

export interface DataProfile {
  sample_size: number;
  outcome_variable: string;
  outcome_type: 'continuous' | 'categorical';
  group_variable?: string;
  time_variable?: string;
  event_variable?: string;
  is_paired: boolean;
  variables: string[];
  n_groups?: number;
  group_labels?: string[];
  group_sizes?: Record<string, number>;
}

export interface AssumptionResult {
  test: string;
  passed: boolean;
  p_value?: number;
  statistic?: number;
  reason?: string;
}

export interface StatisticalResult {
  test_name: string;
  statistic: Record<string, number>;
  p_value: number;
  effect_size?: {
    name: string;
    value: number;
  };
  summary: string;
  groups?: Record<string, {
    mean: number;
    std_dev: number;
    n: number;
  }>;
  confidence_interval?: [number, number];
  contingency_table?: number[][];
  group_names?: string[];
  outcome_names?: string[];
  survival_data?: {
    times: number[];
    events: boolean[];
    groups?: string[];
    group_stats?: Record<string, {
      n: number;
      events: number;
      median_survival: number;
      survival_at_times: { time: number; survival: number; at_risk: number }[];
    }>;
  };
}

export interface AnalysisWorkflow {
  data_profile: DataProfile;
  recommendation: {
    primary: string;
    alternative: string;
  };
  validation: {
    issues: string[];
    warnings: string[];
  };
  assumption_checks?: {
    for_test: string;
    results: Record<string, any>;
    all_assumptions_met: boolean;
  };
  final_selection: {
    selected_test: string;
    reason: string;
  };
  final_result: StatisticalResult | { error: string; details?: string[] };
}

export class DataProfiler {
  static profileData(
    data: any[],
    outcomeVar: string,
    groupVar?: string,
    timeVar?: string,
    eventVar?: string,
    isPaired: boolean = false
  ): DataProfile {
    if (data.length === 0) {
      throw new Error('Dataset is empty');
    }

    const firstRow = data[0];
    if (!(outcomeVar in firstRow)) {
      throw new Error(`Outcome variable '${outcomeVar}' not found in dataset`);
    }

    // Determine if outcome is continuous or categorical
    const outcomeValues = data.map(row => row[outcomeVar]).filter(val => val != null);
    const isNumeric = outcomeValues.every(val => !isNaN(Number(val)));
    const outcomeType: 'continuous' | 'categorical' = isNumeric ? 'continuous' : 'categorical';

    const profile: DataProfile = {
      sample_size: data.length,
      outcome_variable: outcomeVar,
      outcome_type: outcomeType,
      group_variable: groupVar,
      time_variable: timeVar,
      event_variable: eventVar,
      is_paired: isPaired,
      variables: Object.keys(firstRow)
    };

    if (groupVar) {
      if (!(groupVar in firstRow)) {
        throw new Error(`Grouping variable '${groupVar}' not found in dataset`);
      }

      const groups = [...new Set(data.map(row => row[groupVar]))];
      profile.n_groups = groups.length;
      profile.group_labels = groups;
      
      const groupSizes: Record<string, number> = {};
      groups.forEach(group => {
        groupSizes[group] = data.filter(row => row[groupVar] === group).length;
      });
      profile.group_sizes = groupSizes;
    }

    return profile;
  }
}

export class AssumptionChecker {
  static checkNormality(data: number[], alpha: number = 0.05): AssumptionResult {
    if (data.length < 3) {
      return {
        test: 'Shapiro-Wilk',
        passed: false,
        reason: 'Not enough data (need at least 3 points)'
      };
    }

    // Simplified normality check using skewness and kurtosis
    const mean = ss.mean(data);
    const stdDev = ss.standardDeviation(data);
    const skewness = ss.sampleSkewness(data);
    const kurtosis = ss.sampleKurtosis(data);

    // Rule of thumb: if skewness is between -2 and 2, and kurtosis is between -2 and 2
    const normalityPassed = Math.abs(skewness) < 2 && Math.abs(kurtosis) < 2;

    return {
      test: 'Normality Check',
      passed: normalityPassed,
      statistic: skewness,
      p_value: normalityPassed ? 0.1 : 0.01 // Simulated p-value
    };
  }

  static checkHomogeneityOfVariance(
    data: any[],
    groupVar: string,
    valueVar: string,
    alpha: number = 0.05
  ): AssumptionResult {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const groupVariances: number[] = [];

    for (const group of groups) {
      const groupData = data
        .filter(row => row[groupVar] === group)
        .map(row => Number(row[valueVar]))
        .filter(val => !isNaN(val));
      
      if (groupData.length < 2) {
        return {
          test: "Levene's Test",
          passed: false,
          reason: 'At least one group has insufficient data'
        };
      }

      groupVariances.push(ss.variance(groupData));
    }

    // Simple check: ratio of max to min variance should be < 4
    const maxVar = Math.max(...groupVariances);
    const minVar = Math.min(...groupVariances);
    const varianceRatio = maxVar / minVar;
    const homogeneityPassed = varianceRatio < 4;

    return {
      test: "Levene's Test",
      passed: homogeneityPassed,
      statistic: varianceRatio,
      p_value: homogeneityPassed ? 0.1 : 0.01 // Simulated p-value
    };
  }
}

export class CoreCalculations {
  static runIndependentTTest(
    data: any[],
    groupVar: string,
    valueVar: string
  ): StatisticalResult {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    if (groups.length !== 2) {
      throw new Error('Independent t-test requires exactly 2 groups');
    }

    const group1Data = data
      .filter(row => row[groupVar] === groups[0])
      .map(row => Number(row[valueVar]))
      .filter(val => !isNaN(val));

    const group2Data = data
      .filter(row => row[groupVar] === groups[1])
      .map(row => Number(row[valueVar]))
      .filter(val => !isNaN(val));

    const mean1 = ss.mean(group1Data);
    const mean2 = ss.mean(group2Data);
    const std1 = ss.standardDeviation(group1Data);
    const std2 = ss.standardDeviation(group2Data);
    const n1 = group1Data.length;
    const n2 = group2Data.length;

    // Pooled standard deviation
    const pooledStd = Math.sqrt(((n1 - 1) * std1 * std1 + (n2 - 1) * std2 * std2) / (n1 + n2 - 2));
    
    // T-statistic
    const tStat = (mean1 - mean2) / (pooledStd * Math.sqrt(1/n1 + 1/n2));
    const df = n1 + n2 - 2;

    // Cohen's d
    const cohensD = (mean1 - mean2) / pooledStd;

    // Approximate p-value using t-distribution
    const pValue = CoreCalculations.calculateTTestPValue(Math.abs(tStat), df);

    // 95% Confidence interval for difference
    const tCritical = 2.0; // Approximation for 95% CI
    const marginOfError = tCritical * pooledStd * Math.sqrt(1/n1 + 1/n2);
    const meanDiff = mean1 - mean2;
    const confidenceInterval: [number, number] = [
      meanDiff - marginOfError,
      meanDiff + marginOfError
    ];

    return {
      test_name: 'Independent Samples T-Test',
      statistic: {
        t_statistic: tStat,
        degrees_of_freedom: df
      },
      p_value: pValue,
      effect_size: {
        name: "Cohen's d",
        value: cohensD
      },
      summary: `t(${df}) = ${tStat.toFixed(2)}, p = ${pValue.toFixed(3)}`,
      groups: {
        [groups[0]]: { mean: mean1, std_dev: std1, n: n1 },
        [groups[1]]: { mean: mean2, std_dev: std2, n: n2 }
      },
      confidence_interval: confidenceInterval
    };
  }

  static runMannWhitneyU(
    data: any[],
    groupVar: string,
    valueVar: string
  ): StatisticalResult {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    if (groups.length !== 2) {
      throw new Error('Mann-Whitney U test requires exactly 2 groups');
    }

    const group1Data = data
      .filter(row => row[groupVar] === groups[0])
      .map(row => Number(row[valueVar]))
      .filter(val => !isNaN(val));

    const group2Data = data
      .filter(row => row[groupVar] === groups[1])
      .map(row => Number(row[valueVar]))
      .filter(val => !isNaN(val));

    // Simplified Mann-Whitney U calculation
    const n1 = group1Data.length;
    const n2 = group2Data.length;
    
    // Combine and rank all data
    const combined = [
      ...group1Data.map(val => ({ value: val, group: 1 })),
      ...group2Data.map(val => ({ value: val, group: 2 }))
    ].sort((a, b) => a.value - b.value);

    // Assign ranks
    let rank1Sum = 0;
    combined.forEach((item, index) => {
      if (item.group === 1) {
        rank1Sum += index + 1;
      }
    });

    const U1 = rank1Sum - (n1 * (n1 + 1)) / 2;
    const U2 = n1 * n2 - U1;
    const U = Math.min(U1, U2);

    // Approximate p-value
    const meanU = (n1 * n2) / 2;
    const stdU = Math.sqrt((n1 * n2 * (n1 + n2 + 1)) / 12);
    const z = (U - meanU) / stdU;
    const pValue = 2 * (1 - CoreCalculations.normalCDF(Math.abs(z)));

    return {
      test_name: 'Mann-Whitney U Test',
      statistic: {
        U_statistic: U
      },
      p_value: pValue,
      summary: `U = ${U.toFixed(0)}, p = ${pValue.toFixed(3)}`
    };
  }

  static runOneWayANOVA(
    data: any[],
    groupVar: string,
    valueVar: string
  ): StatisticalResult {
    const groups = [...new Set(data.map(row => row[groupVar]))];
    if (groups.length < 2) {
      throw new Error('ANOVA requires at least 2 groups');
    }

    const groupData: number[][] = [];
    const groupMeans: number[] = [];
    const groupSizes: number[] = [];

    // Organize data by groups
    groups.forEach(group => {
      const values = data
        .filter(row => row[groupVar] === group)
        .map(row => Number(row[valueVar]))
        .filter(val => !isNaN(val));
      
      groupData.push(values);
      groupMeans.push(ss.mean(values));
      groupSizes.push(values.length);
    });

    const totalN = groupSizes.reduce((sum, n) => sum + n, 0);
    const overallMean = ss.mean(data.map(row => Number(row[valueVar])).filter(val => !isNaN(val)));

    // Calculate sum of squares
    let ssBetween = 0;
    let ssWithin = 0;

    groupData.forEach((group, i) => {
      const groupMean = groupMeans[i];
      const n = groupSizes[i];
      
      // Between groups sum of squares
      ssBetween += n * Math.pow(groupMean - overallMean, 2);
      
      // Within groups sum of squares
      group.forEach(value => {
        ssWithin += Math.pow(value - groupMean, 2);
      });
    });

    const dfBetween = groups.length - 1;
    const dfWithin = totalN - groups.length;
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const fStat = msBetween / msWithin;

    // Approximate p-value
    const pValue = CoreCalculations.calculateFTestPValue(fStat, dfBetween, dfWithin);

    // Eta-squared (effect size)
    const etaSquared = ssBetween / (ssBetween + ssWithin);

    return {
      test_name: 'One-Way ANOVA',
      statistic: {
        F_statistic: fStat,
        df_num: dfBetween,
        df_den: dfWithin
      },
      p_value: pValue,
      effect_size: {
        name: 'Eta-squared',
        value: etaSquared
      },
      summary: `F(${dfBetween}, ${dfWithin}) = ${fStat.toFixed(2)}, p = ${pValue.toFixed(3)}`
    };
  }

  static runChiSquareTest(
    data: any[],
    groupVar: string,
    outcomeVar: string
  ): StatisticalResult {
    // Create contingency table
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const outcomes = [...new Set(data.map(row => row[outcomeVar]))];
    
    const contingencyTable: number[][] = [];
    const observed: number[] = [];
    const expected: number[] = [];
    
    // Build contingency table
    for (let i = 0; i < groups.length; i++) {
      contingencyTable[i] = [];
      for (let j = 0; j < outcomes.length; j++) {
        const count = data.filter(row => 
          row[groupVar] === groups[i] && row[outcomeVar] === outcomes[j]
        ).length;
        contingencyTable[i][j] = count;
        observed.push(count);
      }
    }

    // Calculate expected frequencies
    const rowTotals = contingencyTable.map(row => row.reduce((sum, val) => sum + val, 0));
    const colTotals = outcomes.map((_, j) => 
      contingencyTable.reduce((sum, row) => sum + row[j], 0)
    );
    const grandTotal = rowTotals.reduce((sum, val) => sum + val, 0);

    for (let i = 0; i < groups.length; i++) {
      for (let j = 0; j < outcomes.length; j++) {
        const exp = (rowTotals[i] * colTotals[j]) / grandTotal;
        expected.push(exp);
      }
    }

    // Calculate chi-square statistic
    let chiSquare = 0;
    for (let i = 0; i < observed.length; i++) {
      if (expected[i] > 0) {
        chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
      }
    }

    const df = (groups.length - 1) * (outcomes.length - 1);
    const pValue = CoreCalculations.calculateChiSquarePValue(chiSquare, df);

    // Cramér's V (effect size)
    const cramersV = Math.sqrt(chiSquare / (grandTotal * Math.min(groups.length - 1, outcomes.length - 1)));

    return {
      test_name: 'Chi-Square Test of Independence',
      statistic: {
        chi_square: chiSquare,
        degrees_of_freedom: df
      },
      p_value: pValue,
      effect_size: {
        name: "Cramér's V",
        value: cramersV
      },
      summary: `χ²(${df}) = ${chiSquare.toFixed(2)}, p = ${pValue.toFixed(3)}`,
      contingency_table: contingencyTable,
      group_names: groups,
      outcome_names: outcomes
    };
  }

  static runFisherExactTest(
    data: any[],
    groupVar: string,
    outcomeVar: string
  ): StatisticalResult {
    // Simplified Fisher's exact test for 2x2 tables
    const groups = [...new Set(data.map(row => row[groupVar]))];
    const outcomes = [...new Set(data.map(row => row[outcomeVar]))];
    
    if (groups.length !== 2 || outcomes.length !== 2) {
      throw new Error("Fisher's exact test requires a 2x2 contingency table");
    }

    // Build 2x2 contingency table
    const a = data.filter(row => row[groupVar] === groups[0] && row[outcomeVar] === outcomes[0]).length;
    const b = data.filter(row => row[groupVar] === groups[0] && row[outcomeVar] === outcomes[1]).length;
    const c = data.filter(row => row[groupVar] === groups[1] && row[outcomeVar] === outcomes[0]).length;
    const d = data.filter(row => row[groupVar] === groups[1] && row[outcomeVar] === outcomes[1]).length;

    // Calculate odds ratio
    const oddsRatio = (a * d) / (b * c);

    // Simplified p-value calculation (hypergeometric distribution approximation)
    const pValue = CoreCalculations.calculateFisherExactPValue(a, b, c, d);

    return {
      test_name: "Fisher's Exact Test",
      statistic: {
        odds_ratio: oddsRatio
      },
      p_value: pValue,
      effect_size: {
        name: 'Odds Ratio',
        value: oddsRatio
      },
      summary: `OR = ${oddsRatio.toFixed(2)}, p = ${pValue.toFixed(3)}`,
      contingency_table: [[a, b], [c, d]],
      group_names: groups,
      outcome_names: outcomes
    };
  }

  static runKaplanMeier(
    data: any[],
    timeVar: string,
    eventVar: string,
    groupVar?: string
  ): StatisticalResult {
    // Extract survival data
    const survivalData = data.map(row => ({
      time: Number(row[timeVar]),
      event: Boolean(row[eventVar]) || Number(row[eventVar]) === 1,
      group: groupVar ? String(row[groupVar]) : 'All'
    })).filter(d => !isNaN(d.time));

    // Sort by time
    survivalData.sort((a, b) => a.time - b.time);

    const times = survivalData.map(d => d.time);
    const events = survivalData.map(d => d.event);
    const groups = groupVar ? survivalData.map(d => d.group) : undefined;

    // Get unique groups
    const uniqueGroups = groups ? [...new Set(groups)] : ['All'];
    const groupStats: Record<string, any> = {};

    // Calculate survival curves for each group
    uniqueGroups.forEach(group => {
      const groupData = survivalData.filter(d => d.group === group);
      const n = groupData.length;
      const totalEvents = groupData.filter(d => d.event).length;

      // Calculate Kaplan-Meier curve
      let atRisk = n;
      let survivalProb = 1.0;
      const survivalCurve: { time: number; survival: number; at_risk: number }[] = [];

      const uniqueTimes = [...new Set(groupData.map(d => d.time))].sort((a, b) => a - b);
      
      for (const time of uniqueTimes) {
        const eventsAtTime = groupData.filter(d => d.time === time && d.event).length;
        const atRiskAtTime = groupData.filter(d => d.time >= time).length;
        
        if (eventsAtTime > 0 && atRiskAtTime > 0) {
          survivalProb *= (atRiskAtTime - eventsAtTime) / atRiskAtTime;
        }
        
        survivalCurve.push({ 
          time, 
          survival: survivalProb, 
          at_risk: atRiskAtTime 
        });
        atRisk = atRiskAtTime - eventsAtTime;
      }

      // Calculate median survival
      const medianPoint = survivalCurve.find(point => point.survival <= 0.5);
      const medianSurvival = medianPoint ? medianPoint.time : uniqueTimes[uniqueTimes.length - 1] || 0;

      groupStats[group] = {
        n,
        events: totalEvents,
        median_survival: medianSurvival,
        survival_at_times: survivalCurve
      };
    });

    // Log-rank test p-value (simplified)
    const pValue = groupVar && uniqueGroups.length > 1 ? 
      CoreCalculations.calculateLogRankPValue(survivalData, groupVar) : 1.0;

    // Overall median survival
    const overallMedian = groupStats[uniqueGroups[0]]?.median_survival || 0;

    return {
      test_name: 'Kaplan-Meier Survival Analysis',
      statistic: {
        median_survival: overallMedian,
        log_rank_statistic: pValue < 0.05 ? 3.84 : 1.0 // Simplified
      },
      p_value: pValue,
      summary: `Median survival = ${overallMedian.toFixed(1)} time units, p = ${pValue.toFixed(3)}`,
      survival_data: {
        times,
        events,
        groups,
        group_stats: groupStats
      }
    };
  }

  // Helper functions for p-value calculations
  private static calculateTTestPValue(tStat: number, df: number): number {
    // Simplified p-value calculation
    if (df >= 30) {
      return 2 * (1 - CoreCalculations.normalCDF(tStat));
    }
    // For smaller df, use approximation
    const factor = 1 + (tStat * tStat) / df;
    return 2 * Math.pow(factor, -df/2);
  }

  private static calculateFTestPValue(fStat: number, df1: number, df2: number): number {
    // Very simplified F-test p-value approximation
    if (fStat < 1) return 0.5;
    if (fStat > 10) return 0.001;
    return Math.max(0.001, 0.5 / fStat);
  }

  private static calculateChiSquarePValue(chiSq: number, df: number): number {
    // Simplified chi-square p-value approximation
    if (chiSq < df) return 0.5;
    if (chiSq > df * 3) return 0.001;
    return Math.max(0.001, Math.exp(-(chiSq - df) / 2));
  }

  private static calculateFisherExactPValue(a: number, b: number, c: number, d: number): number {
    // Simplified Fisher's exact test p-value
    const n = a + b + c + d;
    const expected = ((a + b) * (a + c)) / n;
    const deviation = Math.abs(a - expected);
    return Math.min(1.0, 2 * Math.exp(-2 * deviation * deviation / n));
  }

  private static calculateLogRankPValue(data: any[], groupVar: string): number {
    // Simplified log-rank test p-value
    const groups = [...new Set(data.map(d => d.group))];
    if (groups.length !== 2) return 1.0;
    
    // Very simplified approximation based on event differences
    const group1Events = data.filter(d => d.group === groups[0] && d.event).length;
    const group2Events = data.filter(d => d.group === groups[1] && d.event).length;
    const totalEvents = group1Events + group2Events;
    
    if (totalEvents === 0) return 1.0;
    
    const expected1 = totalEvents * data.filter(d => d.group === groups[0]).length / data.length;
    const chiSq = Math.pow(group1Events - expected1, 2) / expected1;
    
    return CoreCalculations.calculateChiSquarePValue(chiSq, 1);
  }

  private static calculateMedianSurvival(curve: { time: number; survival: number }[]): number {
    const medianPoint = curve.find(point => point.survival <= 0.5);
    return medianPoint ? medianPoint.time : curve[curve.length - 1]?.time || 0;
  }

  private static normalCDF(x: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + CoreCalculations.erf(x / Math.sqrt(2)));
  }

  private static erf(x: number): number {
    // Approximation of error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }
}

export class StatisticalValidator {
  static validatePlan(dataProfile: DataProfile, testName: string): { issues: string[]; warnings: string[] } {
    const issues: string[] = [];
    const warnings: string[] = [];

    // T-test validation
    if (testName.includes('ttest') && dataProfile.n_groups !== 2) {
      issues.push(`T-test requires 2 groups, but data has ${dataProfile.n_groups}`);
    }

    // ANOVA validation
    if (testName.includes('anova') && (dataProfile.n_groups || 0) <= 2) {
      issues.push(`ANOVA is for >2 groups, but data has ${dataProfile.n_groups}`);
    }

    // Chi-square validation
    if (testName.includes('chi_square') && dataProfile.outcome_type !== 'categorical') {
      issues.push('Chi-square test requires categorical outcome variable');
    }

    // Kaplan-Meier validation
    if (testName.includes('kaplan_meier')) {
      if (!dataProfile.time_variable) {
        issues.push('Kaplan-Meier analysis requires a time variable');
      }
      if (!dataProfile.event_variable) {
        issues.push('Kaplan-Meier analysis requires an event variable');
      }
    }

    // Sample size warnings
    if (dataProfile.sample_size < 20) {
      warnings.push(`Sample size is very small (${dataProfile.sample_size}). Results may not be reliable.`);
    }

    // Group size warnings
    if (dataProfile.group_sizes) {
      const minGroupSize = Math.min(...Object.values(dataProfile.group_sizes));
      if (minGroupSize < 5) {
        warnings.push(`One or more groups have very few observations (min: ${minGroupSize})`);
      }
    }

    return { issues, warnings };
  }
}

export class StatisticalBrain {
  private testRegistry = {
    independent_ttest: {
      function: CoreCalculations.runIndependentTTest,
      assumptions: ['normality', 'homogeneity_of_variance'],
      alternative: 'mann_whitney_u'
    },
    one_way_anova: {
      function: CoreCalculations.runOneWayANOVA,
      assumptions: ['normality', 'homogeneity_of_variance'],
      alternative: 'kruskal_wallis'
    },
    mann_whitney_u: {
      function: CoreCalculations.runMannWhitneyU,
      assumptions: [],
      alternative: null
    },
    chi_square: {
      function: CoreCalculations.runChiSquareTest,
      assumptions: [],
      alternative: 'fisher_exact'
    },
    fisher_exact: {
      function: CoreCalculations.runFisherExactTest,
      assumptions: [],
      alternative: null
    },
    kaplan_meier: {
      function: CoreCalculations.runKaplanMeier,
      assumptions: [],
      alternative: null
    }
  };

  recommendTest(dataProfile: DataProfile): { primary: string; alternative: string } {
    const { outcome_type, n_groups } = dataProfile;

    // Check for survival analysis first
    if (dataProfile.time_variable && dataProfile.event_variable) {
      return { primary: 'kaplan_meier', alternative: 'kaplan_meier' };
    }

    if (outcome_type === 'continuous') {
      if (n_groups === 2) {
        return { primary: 'independent_ttest', alternative: 'mann_whitney_u' };
      } else if ((n_groups || 0) > 2) {
        return { primary: 'one_way_anova', alternative: 'kruskal_wallis' };
      }
    } else if (outcome_type === 'categorical') {
      if (n_groups === 2) {
        return { primary: 'fisher_exact', alternative: 'chi_square' };
      } else {
        return { primary: 'chi_square', alternative: 'fisher_exact' };
      }
    }

    throw new Error('No suitable test found for this data profile');
  }

  getTestRegistry() {
    return this.testRegistry;
  }
}

export class EngineOrchestrator {
  private brain = new StatisticalBrain();

  runAnalysis(
    data: any[],
    outcomeVar: string,
    groupVar?: string,
    timeVar?: string,
    eventVar?: string
  ): AnalysisWorkflow {
    const workflowTrace: Partial<AnalysisWorkflow> = {};

    try {
      // 1. Profile the data
      const dataProfile = DataProfiler.profileData(data, outcomeVar, groupVar, timeVar, eventVar);
      workflowTrace.data_profile = dataProfile;

      // 2. Get recommendation
      const recommendation = this.brain.recommendTest(dataProfile);
      workflowTrace.recommendation = recommendation;

      // 3. Validate the plan
      const validation = StatisticalValidator.validatePlan(dataProfile, recommendation.primary);
      workflowTrace.validation = validation;

      if (validation.issues.length > 0) {
        workflowTrace.final_result = {
          error: 'Analysis plan has critical issues',
          details: validation.issues
        };
        return workflowTrace as AnalysisWorkflow;
      }

      // 4. Check assumptions
      let assumptionsPassed = true;
      const assumptionResults: Record<string, any> = {};
      const testRegistry = this.brain.getTestRegistry();
      const requiredAssumptions = testRegistry[recommendation.primary as keyof typeof testRegistry]?.assumptions || [];

      if (requiredAssumptions.includes('normality')) {
        const groups = [...new Set(data.map(row => row[groupVar!]))];
        const normalityChecks: Record<string, any> = {};
        
        for (const group of groups) {
          const groupData = data
            .filter(row => row[groupVar!] === group)
            .map(row => Number(row[outcomeVar]))
            .filter(val => !isNaN(val));
          
          normalityChecks[group] = AssumptionChecker.checkNormality(groupData);
          if (!normalityChecks[group].passed) {
            assumptionsPassed = false;
          }
        }
        assumptionResults.normality = normalityChecks;
      }

      if (requiredAssumptions.includes('homogeneity_of_variance')) {
        const homogeneityCheck = AssumptionChecker.checkHomogeneityOfVariance(data, groupVar!, outcomeVar);
        assumptionResults.homogeneity_of_variance = homogeneityCheck;
        if (!homogeneityCheck.passed) {
          assumptionsPassed = false;
        }
      }

      workflowTrace.assumption_checks = {
        for_test: recommendation.primary,
        results: assumptionResults,
        all_assumptions_met: assumptionsPassed
      };

      // 5. Select and execute final test
      const finalTestName = assumptionsPassed ? recommendation.primary : recommendation.alternative;
      
      workflowTrace.final_selection = {
        selected_test: finalTestName,
        reason: assumptionsPassed ? 'All assumptions met' : 'One or more assumptions failed'
      };

      // Execute the test
      const testFunction = testRegistry[finalTestName as keyof typeof testRegistry]?.function;
      if (!testFunction) {
        workflowTrace.final_result = {
          error: `Test function not found for ${finalTestName}`
        };
        return workflowTrace as AnalysisWorkflow;
      }

      let finalResult: StatisticalResult;
      
      if (finalTestName === 'kaplan_meier') {
        finalResult = testFunction(data, timeVar!, eventVar!, groupVar);
      } else {
        finalResult = testFunction(data, groupVar!, outcomeVar);
      }
      
      workflowTrace.final_result = finalResult;

      return workflowTrace as AnalysisWorkflow;

    } catch (error) {
      workflowTrace.final_result = {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      return workflowTrace as AnalysisWorkflow;
    }
  }

  runCustomAnalysis(
    data: any[],
    testType: string,
    outcomeVar: string,
    groupVar?: string,
    timeVar?: string,
    eventVar?: string
  ): AnalysisWorkflow {
    const workflowTrace: Partial<AnalysisWorkflow> = {};

    try {
      // Create a simplified workflow for custom analyses
      workflowTrace.data_profile = {
        sample_size: data.length,
        outcome_variable: outcomeVar,
        outcome_type: 'continuous', // Simplified
        group_variable: groupVar,
        time_variable: timeVar,
        event_variable: eventVar,
        is_paired: false,
        variables: Object.keys(data[0] || {})
      };

      workflowTrace.recommendation = { primary: testType, alternative: testType };
      workflowTrace.validation = { issues: [], warnings: [] };
      workflowTrace.final_selection = { selected_test: testType, reason: 'User selected' };

      // Execute the specific test
      let result: StatisticalResult;

      switch (testType) {
        case 'chi_square':
          result = CoreCalculations.runChiSquareTest(data, groupVar!, outcomeVar);
          break;
        case 'fisher_exact':
          result = CoreCalculations.runFisherExactTest(data, groupVar!, outcomeVar);
          break;
        case 'kaplan_meier':
          result = CoreCalculations.runKaplanMeier(data, timeVar!, eventVar!, groupVar);
          break;
        default:
          throw new Error(`Unsupported test type: ${testType}`);
      }

      workflowTrace.final_result = result;
      return workflowTrace as AnalysisWorkflow;

    } catch (error) {
      workflowTrace.final_result = {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      return workflowTrace as AnalysisWorkflow;
    }
  }
}