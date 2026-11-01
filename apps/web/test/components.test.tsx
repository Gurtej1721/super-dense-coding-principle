import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageSelector } from '../components/MessageSelector';
import { Controls } from '../components/Controls';
import { ProbabilityBars } from '../components/ProbabilityBars';
import { Timeline } from '../components/Timeline';
import { ComparisonCircuit } from '../components/ComparisonCircuit';
import { EntanglementComparison } from '../components/EntanglementComparison';
import { simulateSuperdense } from '@quantum/core';

describe('MessageSelector Component', () => {
  it('renders all four classical message options', () => {
    const onSelect = vi.fn();
    render(<MessageSelector selectedMessage="00" onSelect={onSelect} />);

    expect(screen.getByText('00')).toBeInTheDocument();
    expect(screen.getByText('01')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('11')).toBeInTheDocument();
  });

  it('triggers onSelect when a message is clicked', () => {
    const onSelect = vi.fn();
    render(<MessageSelector selectedMessage="00" onSelect={onSelect} />);

    fireEvent.click(screen.getByText('10'));
    expect(onSelect).toHaveBeenCalledWith('10');
  });
});

describe('Controls Component', () => {
  it('triggers run callback when Run Protocol is clicked', () => {
    const onRun = vi.fn();
    render(
      <Controls
        isRunning={false}
        onRun={onRun}
        onReset={vi.fn()}
        currentStep={0}
        totalSteps={8}
        onStepChange={vi.fn()}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        speed={1}
        onChangeSpeed={vi.fn()}
        shots={1000}
        onChangeShots={vi.fn()}
        seed={42}
        onRerollSeed={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Run Protocol'));
    expect(onRun).toHaveBeenCalled();
  });

  it('triggers reset callback when Reset is clicked', () => {
    const onReset = vi.fn();
    render(
      <Controls
        isRunning={false}
        onRun={vi.fn()}
        onReset={onReset}
        currentStep={3}
        totalSteps={8}
        onStepChange={vi.fn()}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        speed={1}
        onChangeSpeed={vi.fn()}
        shots={1000}
        onChangeShots={vi.fn()}
        seed={42}
        onRerollSeed={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Reset'));
    expect(onReset).toHaveBeenCalled();
  });

  it('shows inline validation error when invalid shots are entered', () => {
    render(
      <Controls
        isRunning={false}
        onRun={vi.fn()}
        onReset={vi.fn()}
        currentStep={0}
        totalSteps={8}
        onStepChange={vi.fn()}
        isPlaying={false}
        onTogglePlay={vi.fn()}
        speed={1}
        onChangeSpeed={vi.fn()}
        shots={1000}
        onChangeShots={vi.fn()}
        seed={42}
        onRerollSeed={vi.fn()}
      />
    );

    const input = screen.getByLabelText(/Measurement Shots/i);
    fireEvent.change(input, { target: { value: '-10' } });

    expect(screen.getByText(/Shots must be an integer between 0 and 100,000/i)).toBeInTheDocument();
  });
});

describe('ProbabilityBars Component', () => {
  it('renders all basis states and displays correct probabilities', () => {
    const probs = { '00': 0.0, '01': 0.0, '10': 0.0, '11': 1.0 };
    render(<ProbabilityBars probabilities={probs} targetMessage="11" />);

    expect(screen.getByText('|00⟩')).toBeInTheDocument();
    expect(screen.getByText('|01⟩')).toBeInTheDocument();
    expect(screen.getByText('|10⟩')).toBeInTheDocument();
    expect(screen.getByText('|11⟩')).toBeInTheDocument();
    expect(screen.getByText('100.0%')).toBeInTheDocument();
  });
});

describe('Timeline Component', () => {
  it('renders step progression and responds to step selection', () => {
    const sim = simulateSuperdense('01', 1000, 42);
    const onSelectStep = vi.fn();

    render(
      <Timeline
        snapshots={sim.snapshots}
        currentStep={2}
        onSelectStep={onSelectStep}
      />
    );

    expect(screen.getByText(/Entanglement Generation/i)).toBeInTheDocument();
    const step3Button = screen.getByText('Alice Encode');
    fireEvent.click(step3Button);
    expect(onSelectStep).toHaveBeenCalledWith(3);
  });
});

describe('ComparisonCircuit Component', () => {
  it('renders circuit diagram for entangled mode with H and CNOT gates', () => {
    const sim = simulateSuperdense('01', 1000, 42);
    render(
      <ComparisonCircuit
        mode="with_entanglement"
        message="01"
        currentStep={2}
        snapshots={sim.snapshots}
      />
    );

    expect(screen.getByText(/ALICE'S DOMAIN/i)).toBeInTheDocument();
    expect(screen.getByText(/BOB'S DOMAIN/i)).toBeInTheDocument();
    expect(screen.getByText(/\|0⟩ q0/i)).toBeInTheDocument();
    expect(screen.getByText(/\|0⟩ q1/i)).toBeInTheDocument();
    expect(screen.getAllByText('H').length).toBeGreaterThanOrEqual(1);
  });

  it('renders unentangled mode displaying NO ENTANGLEMENT banner', () => {
    const sim = simulateSuperdense('00', 1000, 42, { mode: 'without_entanglement' });
    render(
      <ComparisonCircuit
        mode="without_entanglement"
        message="00"
        currentStep={1}
        snapshots={sim.snapshots}
      />
    );

    expect(screen.getByText(/NO ENTANGLEMENT/i)).toBeInTheDocument();
  });
});

describe('EntanglementComparison Component', () => {
  it('renders side-by-side comparison panels with concurrence metrics', () => {
    render(<EntanglementComparison initialMessage="11" />);

    expect(screen.getAllByText(/With Shared Entanglement/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/Without Entanglement/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/C = 1.000/i)).toBeInTheDocument();
    expect(screen.getByText(/C = 0.000/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Deterministic Decoding/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Ambiguous Decoding/i).length).toBeGreaterThanOrEqual(1);
  });

  it('switches classical message when message button is clicked', () => {
    render(<EntanglementComparison initialMessage="00" />);

    const btn10 = screen.getByText('10');
    fireEvent.click(btn10);

    expect(screen.getByText(/Encoding: Z \(Phase Flip\)/i)).toBeInTheDocument();
  });
});
