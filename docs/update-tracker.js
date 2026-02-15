#!/usr/bin/env node

/**
 * Update Tracker - Minimal tracker for Agentik OS
 *
 * Usage:
 *   node update-tracker.js start <step-id> <title> <hours>   # Start a step
 *   node update-tracker.js complete <hours>                   # Complete current step
 *   node update-tracker.js status                             # Show status
 */

const fs = require('fs');
const path = require('path');

const TRACKER_FILE = path.join(__dirname, 'tracker.json');
const STEPS_FILE = path.join(__dirname, 'step.json');

function loadTracker() {
  return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
}

function saveTracker(tracker) {
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
}

function loadSteps() {
  const data = JSON.parse(fs.readFileSync(STEPS_FILE, 'utf-8'));
  const allSteps = [];

  for (let phase of data.phases) {
    allSteps.push(...phase.steps);
  }

  return allSteps;
}

function getStepInfo(stepId) {
  const steps = loadSteps();
  return steps.find(s => s.id === stepId);
}

function startStep(stepId, title, hours) {
  const tracker = loadTracker();
  const stepInfo = getStepInfo(stepId);

  if (!stepInfo) {
    console.error(`❌ Step ${stepId} not found in step.json`);
    process.exit(1);
  }

  tracker.current = {
    id: stepId,
    title: title || stepInfo.title,
    phase: stepInfo.phase,
    estimatedHours: hours || stepInfo.estimatedHours,
    startedAt: new Date().toISOString()
  };

  saveTracker(tracker);

  console.log(`🚀 Started: ${stepId}`);
  console.log(`   Title: ${tracker.current.title}`);
  console.log(`   Phase: ${tracker.current.phase}`);
  console.log(`   Estimated: ${tracker.current.estimatedHours}h`);
}

function completeStep(hours) {
  const tracker = loadTracker();

  if (!tracker.current) {
    console.error('❌ No step currently in progress');
    process.exit(1);
  }

  const completedStep = {
    ...tracker.current,
    completedAt: new Date().toISOString(),
    actualHours: hours || tracker.current.estimatedHours
  };

  tracker.lastCompleted = completedStep;
  tracker.statistics.completedCount++;
  tracker.statistics.completedHours += completedStep.actualHours;
  tracker.statistics.progress = `${Math.round((tracker.statistics.completedCount / tracker.totalSteps) * 100)}%`;
  tracker.history.push(completedStep);
  tracker.current = null;

  saveTracker(tracker);

  console.log(`✅ Completed: ${completedStep.id}`);
  console.log(`   Title: ${completedStep.title}`);
  console.log(`   Time: ${completedStep.actualHours}h`);
  console.log(`\n📊 Progress: ${tracker.statistics.completedCount}/${tracker.totalSteps} (${tracker.statistics.progress})`);
  console.log(`   Total hours: ${tracker.statistics.completedHours}h / ${tracker.statistics.totalEstimatedHours}h`);
}

function showStatus() {
  const tracker = loadTracker();

  console.log(`\n📊 Agentik OS - Tracker Status\n`);
  console.log(`Progress: ${tracker.statistics.completedCount}/${tracker.totalSteps} steps (${tracker.statistics.progress})`);
  console.log(`Hours: ${tracker.statistics.completedHours}h / ${tracker.statistics.totalEstimatedHours}h\n`);

  if (tracker.current) {
    console.log(`🚀 Currently Working On:\n`);
    console.log(`   ID: ${tracker.current.id}`);
    console.log(`   Title: ${tracker.current.title}`);
    console.log(`   Phase: ${tracker.current.phase}`);
    console.log(`   Estimated: ${tracker.current.estimatedHours}h`);
    console.log(`   Started: ${tracker.current.startedAt}\n`);
  } else {
    console.log(`💤 No step currently in progress\n`);
  }

  if (tracker.lastCompleted) {
    console.log(`✅ Last Completed:\n`);
    console.log(`   ID: ${tracker.lastCompleted.id}`);
    console.log(`   Title: ${tracker.lastCompleted.title}`);
    console.log(`   Completed: ${tracker.lastCompleted.completedAt}`);
    console.log(`   Time: ${tracker.lastCompleted.actualHours}h\n`);
  }

  if (tracker.history.length > 0) {
    console.log(`📜 Recent History (last 5):\n`);
    tracker.history.slice(-5).reverse().forEach(step => {
      console.log(`   ${step.id}: ${step.title} (${step.actualHours}h)`);
    });
    console.log();
  }
}

// Main
const [,, command, arg1, arg2, arg3] = process.argv;

if (!command) {
  console.log(`
Usage:
  node update-tracker.js start <step-id> [title] [hours]   # Start a step
  node update-tracker.js complete [hours]                   # Complete current step
  node update-tracker.js status                             # Show status

Examples:
  node update-tracker.js start step-001
  node update-tracker.js start step-002 "Custom Title" 10
  node update-tracker.js complete 8
  node update-tracker.js status
  `);
  process.exit(0);
}

switch (command) {
  case 'start':
    if (!arg1) {
      console.error('❌ Missing step-id');
      process.exit(1);
    }
    startStep(arg1, arg2, arg3 ? parseInt(arg3) : null);
    break;

  case 'complete':
    completeStep(arg1 ? parseInt(arg1) : null);
    break;

  case 'status':
    showStatus();
    break;

  default:
    console.error(`❌ Unknown command: ${command}`);
    process.exit(1);
}
