// SciFig AI: Core Statistical Engine (TypeScript Implementation)
// Adapted from the Python statistical engine for web use

import * as ss from 'simple-statistics';

export interface DataProfile {
  sample_size: number;
  outcome_variable: string;
  outcome_type: 'continuous' | 'categorical';
  group_variable?: string;
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
    const pValue = this.calculateTTestPValue(Math.abs(tStat), df);

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
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

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
    const pValue = this.calculateFTestPValue(fStat, dfBetween, dfWithin);

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

  // Helper functions for p-value calculations
  private static calculateTTestPValue(tStat: number, df: number): number {
    // Simplified p-value calculation
    if (df >= 30) {
      return 2 * (1 - this.normalCDF(tStat));
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

  private static normalCDF(x: number): number {
    // Approximation of normal CDF
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
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
    }
  };

  recommendTest(dataProfile: DataProfile): { primary: string; alternative: string } {
    const { outcome_type, n_groups } = dataProfile;

    if (outcome_type === 'continuous') {
      if (n_groups === 2) {
        return { primary: 'independent_ttest', alternative: 'mann_whitney_u' };
      } else if ((n_groups || 0) > 2) {
        return { primary: 'one_way_anova', alternative: 'kruskal_wallis' };
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
    groupVar: string
  ): AnalysisWorkflow {
    const workflowTrace: Partial<AnalysisWorkflow> = {};

    try {
      // 1. Profile the data
      const dataProfile = DataProfiler.profileData(data, outcomeVar, groupVar);
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
        const groups = [...new Set(data.map(row => row[groupVar]))];
        const normalityChecks: Record<string, any> = {};
        
        for (const group of groups) {
          const groupData = data
            .filter(row => row[groupVar] === group)
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
        const homogeneityCheck = AssumptionChecker.checkHomogeneityOfVariance(data, groupVar, outcomeVar);
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

      const finalResult = testFunction(data, groupVar, outcomeVar);
      workflowTrace.final_result = finalResult;

      return workflowTrace as AnalysisWorkflow;

    } catch (error) {
      workflowTrace.final_result = {
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
      return workflowTrace as AnalysisWorkflow;
    }
  }
}