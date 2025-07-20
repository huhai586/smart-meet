#!/usr/bin/env node

const fs = require('fs');

// Read and parse the eslint report
function parseEslintReport() {
    try {
        const reportPath = './eslint-report.json';
        const reportContent = fs.readFileSync(reportPath, 'utf8');
        const eslintResults = JSON.parse(reportContent);
        
        return eslintResults;
    } catch (error) {
        console.error('Error reading eslint report:', error);
        return null;
    }
}

// Categorize errors by rule
function categorizeErrors(eslintResults) {
    const errorsByRule = {};
    const fileErrorCounts = {};
    
    eslintResults.forEach(fileResult => {
        const { filePath, messages, errorCount, warningCount } = fileResult;
        
        // Track file-level statistics
        if (errorCount > 0 || warningCount > 0) {
            fileErrorCounts[filePath] = {
                errors: errorCount,
                warnings: warningCount,
                total: errorCount + warningCount
            };
        }
        
        // Categorize each message by rule
        messages.forEach(message => {
            const { ruleId, severity, line, column, messageId } = message;
            
            if (!errorsByRule[ruleId]) {
                errorsByRule[ruleId] = {
                    ruleId,
                    severity: severity === 2 ? 'error' : 'warning',
                    count: 0,
                    files: new Set(),
                    occurrences: []
                };
            }
            
            errorsByRule[ruleId].count++;
            errorsByRule[ruleId].files.add(filePath);
            errorsByRule[ruleId].occurrences.push({
                file: filePath,
                line,
                column,
                message: message.message,
                messageId
            });
        });
    });
    
    // Convert Sets to Arrays for JSON serialization
    Object.values(errorsByRule).forEach(rule => {
        rule.files = Array.from(rule.files);
    });
    
    return { errorsByRule, fileErrorCounts };
}

// Generate fix strategies based on rule types
function generateFixStrategies(errorsByRule) {
    const fixStrategies = {
        '@typescript-eslint/no-unused-vars': {
            strategy: 'Remove unused variables or prefix with underscore if intentionally unused',
            priority: 'Medium',
            effort: 'Low',
            automated: 'Partially - ESLint can auto-fix some cases',
            owner: 'Development Team',
            estimatedTime: '1-2 hours'
        },
        '@typescript-eslint/no-explicit-any': {
            strategy: 'Replace `any` with proper TypeScript types or `unknown` if type is truly unknown',
            priority: 'High',
            effort: 'Medium',
            automated: 'No - requires manual type definition',
            owner: 'Development Team',
            estimatedTime: '4-8 hours'
        },
        'react-hooks/exhaustive-deps': {
            strategy: 'Add missing dependencies to useEffect/useCallback/useMemo dependency arrays',
            priority: 'High',
            effort: 'Medium',
            automated: 'Partially - ESLint can suggest fixes',
            owner: 'React Developer',
            estimatedTime: '2-4 hours'
        }
    };
    
    // Add strategies for rules found in the report
    Object.keys(errorsByRule).forEach(ruleId => {
        if (!fixStrategies[ruleId]) {
            // Generic strategy for unknown rules
            fixStrategies[ruleId] = {
                strategy: 'Review ESLint documentation and apply appropriate fixes',
                priority: errorsByRule[ruleId].severity === 'error' ? 'High' : 'Medium',
                effort: 'Medium',
                automated: 'Unknown',
                owner: 'Development Team',
                estimatedTime: 'TBD'
            };
        }
    });
    
    return fixStrategies;
}

// Generate summary statistics
function generateSummary(errorsByRule, fileErrorCounts) {
    const totalErrors = Object.values(errorsByRule).reduce((sum, rule) => 
        sum + (rule.severity === 'error' ? rule.count : 0), 0);
    
    const totalWarnings = Object.values(errorsByRule).reduce((sum, rule) => 
        sum + (rule.severity === 'warning' ? rule.count : 0), 0);
    
    const filesWithIssues = Object.keys(fileErrorCounts).length;
    
    const topRules = Object.values(errorsByRule)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    return {
        totalErrors,
        totalWarnings,
        totalIssues: totalErrors + totalWarnings,
        filesWithIssues,
        totalRulesViolated: Object.keys(errorsByRule).length,
        topRules: topRules.map(rule => ({
            ruleId: rule.ruleId,
            count: rule.count,
            severity: rule.severity
        }))
    };
}

// Create tracking sheet
function createTrackingSheet(errorsByRule, fixStrategies, summary, fileErrorCounts) {
    const trackingSheet = {
        summary,
        ruleBreakdown: Object.keys(errorsByRule).map(ruleId => ({
            ruleId,
            severity: errorsByRule[ruleId].severity,
            count: errorsByRule[ruleId].count,
            filesAffected: errorsByRule[ruleId].files.length,
            fixStrategy: fixStrategies[ruleId].strategy,
            priority: fixStrategies[ruleId].priority,
            effort: fixStrategies[ruleId].effort,
            automated: fixStrategies[ruleId].automated,
            owner: fixStrategies[ruleId].owner,
            estimatedTime: fixStrategies[ruleId].estimatedTime,
            files: errorsByRule[ruleId].files
        })).sort((a, b) => b.count - a.count), // Sort by count descending
        
        fileBreakdown: Object.keys(fileErrorCounts).map(filePath => ({
            file: filePath.replace(process.cwd() + '/', ''), // Make path relative
            errors: fileErrorCounts[filePath].errors,
            warnings: fileErrorCounts[filePath].warnings,
            total: fileErrorCounts[filePath].total
        })).sort((a, b) => b.total - a.total), // Sort by total issues descending
        
        detailedOccurrences: errorsByRule
    };
    
    return trackingSheet;
}

// Generate markdown report
function generateMarkdownReport(trackingSheet) {
    const { summary, ruleBreakdown, fileBreakdown } = trackingSheet;
    
    const markdown = `# ESLint Audit Report

Generated on: ${new Date().toISOString()}

## Summary

- **Total Issues**: ${summary.totalIssues}
- **Errors**: ${summary.totalErrors}
- **Warnings**: ${summary.totalWarnings}  
- **Files with Issues**: ${summary.filesWithIssues}
- **Rules Violated**: ${summary.totalRulesViolated}

## Top Rule Violations

${summary.topRules.map((rule, index) => 
    `${index + 1}. **${rule.ruleId}** (${rule.severity}): ${rule.count} occurrences`
).join('\n')}

## Rule-by-Rule Breakdown

| Rule ID | Severity | Count | Files | Priority | Effort | Owner | Fix Strategy |
|---------|----------|-------|-------|----------|--------|-------|--------------|
${ruleBreakdown.map(rule => 
    `| ${rule.ruleId} | ${rule.severity} | ${rule.count} | ${rule.filesAffected} | ${rule.priority} | ${rule.effort} | ${rule.owner} | ${rule.fixStrategy} |`
).join('\n')}

## Files with Most Issues

| File | Errors | Warnings | Total |
|------|--------|----------|-------|
${fileBreakdown.slice(0, 10).map(file => 
    `| ${file.file} | ${file.errors} | ${file.warnings} | ${file.total} |`
).join('\n')}

## Detailed Fix Strategies

${ruleBreakdown.map(rule => `
### ${rule.ruleId}

- **Priority**: ${rule.priority}
- **Effort Level**: ${rule.effort}
- **Can be Automated**: ${rule.automated}
- **Owner**: ${rule.owner}
- **Estimated Time**: ${rule.estimatedTime}
- **Fix Strategy**: ${rule.fixStrategy}
- **Occurrences**: ${rule.count} across ${rule.filesAffected} files

**Files affected:**
${rule.files.map(file => `- ${file.replace(process.cwd() + '/', '')}`).join('\n')}
`).join('\n')}
`;

    return markdown;
}

// Main function
function main() {
    console.log('🔍 Parsing ESLint report...');
    
    const eslintResults = parseEslintReport();
    if (!eslintResults) {
        console.error('❌ Failed to parse ESLint report');
        return;
    }
    
    console.log('📊 Categorizing errors by rule...');
    const { errorsByRule, fileErrorCounts } = categorizeErrors(eslintResults);
    
    console.log('🛠️  Generating fix strategies...');
    const fixStrategies = generateFixStrategies(errorsByRule);
    
    console.log('📈 Generating summary...');
    const summary = generateSummary(errorsByRule, fileErrorCounts);
    
    console.log('📋 Creating tracking sheet...');
    const trackingSheet = createTrackingSheet(errorsByRule, fixStrategies, summary, fileErrorCounts);
    
    console.log('💾 Saving results...');
    
    // Save JSON tracking sheet
    fs.writeFileSync('./eslint-audit-tracking.json', JSON.stringify(trackingSheet, null, 2));
    
    // Generate and save markdown report
    const markdownReport = generateMarkdownReport(trackingSheet);
    fs.writeFileSync('./eslint-audit-report.md', markdownReport);
    
    // Generate CSV for easy spreadsheet import
    const csvHeader = 'Rule ID,Severity,Count,Files Affected,Priority,Effort,Owner,Fix Strategy\n';
    const csvRows = trackingSheet.ruleBreakdown.map(rule => 
        `"${rule.ruleId}","${rule.severity}",${rule.count},${rule.filesAffected},"${rule.priority}","${rule.effort}","${rule.owner}","${rule.fixStrategy}"`
    ).join('\n');
    fs.writeFileSync('./eslint-audit-tracking.csv', csvHeader + csvRows);
    
    console.log('\n✅ Audit complete! Generated files:');
    console.log('- eslint-audit-tracking.json (detailed JSON data)');
    console.log('- eslint-audit-report.md (formatted report)');
    console.log('- eslint-audit-tracking.csv (spreadsheet format)');
    
    console.log('\n📊 Quick Summary:');
    console.log(`Total Issues: ${summary.totalIssues} (${summary.totalErrors} errors, ${summary.totalWarnings} warnings)`);
    console.log(`Files Affected: ${summary.filesWithIssues}`);
    console.log(`Rules Violated: ${summary.totalRulesViolated}`);
    
    console.log('\n🔥 Top Issues to Address:');
    summary.topRules.forEach((rule, index) => {
        console.log(`${index + 1}. ${rule.ruleId}: ${rule.count} occurrences`);
    });
}

if (require.main === module) {
    main();
}

module.exports = { parseEslintReport, categorizeErrors, generateFixStrategies, createTrackingSheet };
