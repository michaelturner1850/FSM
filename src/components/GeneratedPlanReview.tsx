import type { MaintenancePlanRecommendation } from "../types/maintenancePlan";

interface GeneratedPlanReviewProps {
  plan: MaintenancePlanRecommendation;
  isGenerating: boolean;
  onRegenerate: () => void;
  onEditSelections: () => void;
  onApprove: () => void;
}

export function GeneratedPlanReview({
  plan,
  isGenerating,
  onRegenerate,
  onEditSelections,
  onApprove,
}: GeneratedPlanReviewProps) {
  return (
    <div className="review-screen">
      <div className="review-heading">
        <div>
          <p className="eyebrow">Based on successful maintenance plans from similar contractors.</p>
          <h2>{plan.plan_name}</h2>
        </div>
        <span className="price-pill">${plan.pricing.computed_annual_total.toLocaleString()} / year</span>
      </div>

      <div className="review-grid">
        <article className="review-card full-span">
          <h3>Included Services</h3>
          <ul>
            {plan.included_services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </article>

        <article className="review-card">
          <h3>Excluded Services</h3>
          <ul>
            {plan.excluded_services.map((service) => (
              <li key={service}>{service}</li>
            ))}
          </ul>
        </article>

        <article className="review-card">
          <h3>Terms</h3>
          <p>{plan.terms_and_conditions}</p>
        </article>

        <article className="review-card">
          <h3>Plan Details</h3>
          <dl>
            <div>
              <dt>Contract Length</dt>
              <dd>{plan.contract_length_years} year(s)</dd>
            </div>
            <div>
              <dt>Service Windows</dt>
              <dd>
                {plan.service_frequency.service_windows
                  .map((window) => `${window.job_name} (${window.start_month}-${window.end_month})`)
                  .join("; ")}
              </dd>
            </div>
            <div>
              <dt>Coverage</dt>
              <dd>{plan.coverage_level}</dd>
            </div>
            <div>
              <dt>Collect Tax</dt>
              <dd>{plan.pricing.collect_tax ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </article>

        <article className="review-card full-span">
          <h3>Why this recommendation?</h3>
          <p>{plan.recommendation_explanation}</p>
          <p>
            <strong>Confidence:</strong> {(plan.confidence * 100).toFixed(0)}%
          </p>
          <h4>Similar historical plans</h4>
          <div className="seed-list">
            {plan.similar_historical_plans.map((hist) => (
              <span key={hist.plan_name}>
                {hist.plan_name}
                {hist.popularity_percent > 0 ? ` (${hist.popularity_percent}% of comparable contracts)` : ""}
              </span>
            ))}
          </div>
          <h4>Optional add-ons</h4>
          <div className="seed-list">
            {plan.optional_addons.map((addon) => (
              <span key={addon.name}>{addon.name}</span>
            ))}
          </div>
        </article>
      </div>

      <div className="review-actions review-actions-balanced">
        <button type="button" className="secondary-button" onClick={onEditSelections}>
          Edit selections
        </button>
        <button type="button" className="secondary-button" onClick={onRegenerate} disabled={isGenerating}>
          {isGenerating ? "Regenerating..." : "Regenerate"}
        </button>
        <button type="button" className="primary-button" onClick={onApprove}>
          Approve and Populate Form
        </button>
      </div>
    </div>
  );
}
