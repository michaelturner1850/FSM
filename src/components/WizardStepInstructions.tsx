interface WizardStepInstructionsProps {
  value: string;
  onChange: (value: string) => void;
}

export function WizardStepInstructions({ value, onChange }: WizardStepInstructionsProps) {
  return (
    <div className="wizard-step">
      <h2>Add optional instructions</h2>
      <p>Give the generator a simple preference. This is optional.</p>
      <label className="wizard-field">
        Optional instructions
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Examples you can type:&#10;- Keep this affordable for first-time homeowners&#10;- Add priority service and a 10% repair discount&#10;- Keep annual price under $250&#10;- Make this easier for customers to understand&#10;- Include plumbing inspection and water heater flush"
          rows={7}
        />
      </label>
    </div>
  );
}
