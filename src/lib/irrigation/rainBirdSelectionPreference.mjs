/**
 * Owner-approved Florial selection preferences.
 *
 * These are prioritization rules, not manufacturer performance limits and not
 * a hydraulic compatibility decision. Eligibility still requires an exact
 * manufacturer operating point, body/nozzle compatibility and hydraulic proof.
 */
export const RAIN_BIRD_SELECTION_PREFERENCE = Object.freeze({
  sprayNozzles: Object.freeze({
    preferredFamily: 'R-VAN',
    alternativeFamily: 'HE-VAN',
    priorityOrder: Object.freeze(['R-VAN', 'HE-VAN']),
    preferredUse: 'Small residential lawns, especially plots around 5m wide where geometry and throw suit R-VAN.',
    alternativeUse: 'Lower-cost alternative only when coverage, precipitation compatibility, operating pressure, flow and body compatibility all pass.',
    rationale: 'Owner field experience prioritizes R-VAN for irrigation quality and practical water-demand efficiency.',
  }),
  rotors: Object.freeze({
    preferredFamily: '3500',
    preferredRadiusRangeM: Object.freeze([6, 8.5]),
    conditionalUpperRadiusM: 9,
    considerFamilyAboveRadiusM: 9,
    largerFamily: '5000',
    rationale: 'Prefer 3500 for common medium residential lawns; consider 5000 when the required throw exceeds the practical 3500 range and the source/network can support it.',
  }),
  safeguards: Object.freeze([
    'Preference never overrides exact manufacturer operating-point data.',
    'Compare pressure at the sprinkler/nozzle, not only at the source.',
    'Compare zone flow and pipe losses; lower per-head flow does not by itself prove that more heads fit one zone.',
    'Do not offer HE-VAN if it fails coverage, precipitation, pressure or compatibility checks.',
    'Do not select 5000 solely by radius; verify nozzle configuration, source capacity and pipe network.',
  ]),
})
