import { PLACEHOLDER as B } from "./equationEdit";

/**
 * The building blocks offered by the "Insert equation" dialog. `tex` may contain empty boxes (\square) that
 * the student fills in; the dialog selects the first one after inserting.
 */
export interface EquationTemplate {
  /** Spoken / accessible name — what a screen reader announces for the button. */
  name: string;
  tex: string;
}

export interface EquationCategory {
  id: string;
  label: string;
  templates: EquationTemplate[];
}

const t = (name: string, tex: string): EquationTemplate => ({ name, tex });

export const EQUATION_CATEGORIES: EquationCategory[] = [
  {
    id: "basic",
    label: "Fractions & roots",
    templates: [
      t("Fraction", `\\frac{${B}}{${B}}`),
      t("Mixed number", `${B}\\frac{${B}}{${B}}`),
      t("Percentage", `${B}\\%`),
      t("Square root", `\\sqrt{${B}}`),
      t("Nth root", `\\sqrt[${B}]{${B}}`),
      t("Brackets", `\\left(${B}\\right)`),
      t("Square brackets", `\\left[${B}\\right]`),
      t("Absolute value", `\\left|${B}\\right|`),
      t("Plus or minus", "\\pm"),
      t("Multiplication sign", "\\times"),
      t("Division sign", "\\div"),
      t("Dot", "\\cdot"),
      t("Binomial coefficient", `\\binom{${B}}{${B}}`),
    ],
  },
  {
    id: "scripts",
    label: "Powers & subscripts",
    templates: [
      t("Power", `${B}^{${B}}`),
      t("Subscript", `${B}_{${B}}`),
      t("Subscript and power", `${B}_{${B}}^{${B}}`),
      t("Squared", "^{2}"),
      t("Cubed", "^{3}"),
      t("Degrees", "^{\\circ}"),
      t("Scientific notation", `${B}\\times 10^{${B}}`),
      t("Bar over", `\\overline{${B}}`),
      t("Vector", `\\vec{${B}}`),
      t("Hat", `\\hat{${B}}`),
      t("Logarithm with base", `\\log_{${B}}${B}`),
      t("Natural logarithm", `\\ln ${B}`),
    ],
  },
  {
    id: "symbols",
    label: "Symbols",
    templates: [
      t("Less than or equal to", "\\le"),
      t("Greater than or equal to", "\\ge"),
      t("Not equal to", "\\ne"),
      t("Approximately equal to", "\\approx"),
      t("Proportional to", "\\propto"),
      t("Identical to", "\\equiv"),
      t("Right arrow", "\\rightarrow"),
      t("Implies", "\\Rightarrow"),
      t("If and only if", "\\Leftrightarrow"),
      t("Element of", "\\in"),
      t("Not an element of", "\\notin"),
      t("Subset", "\\subset"),
      t("Union", "\\cup"),
      t("Intersection", "\\cap"),
      t("Empty set", "\\emptyset"),
      t("Infinity", "\\infty"),
      t("Therefore", "\\therefore"),
      t("Because", "\\because"),
    ],
  },
  {
    id: "greek",
    label: "Greek letters",
    templates: [
      ["alpha", "\\alpha"], ["beta", "\\beta"], ["gamma", "\\gamma"], ["delta", "\\delta"],
      ["epsilon", "\\epsilon"], ["theta", "\\theta"], ["lambda", "\\lambda"], ["mu", "\\mu"],
      ["pi", "\\pi"], ["rho", "\\rho"], ["sigma", "\\sigma"], ["tau", "\\tau"],
      ["phi", "\\phi"], ["omega", "\\omega"], ["capital delta", "\\Delta"], ["capital sigma", "\\Sigma"],
      ["capital phi", "\\Phi"], ["capital omega", "\\Omega"],
    ].map(([name, tex]) => t(`Greek ${name}`, tex)),
  },
  {
    id: "geometry",
    label: "Geometry",
    templates: [
      t("Angle", "\\angle"),
      t("Triangle", "\\triangle"),
      t("Parallel to", "\\parallel"),
      t("Perpendicular to", "\\perp"),
      t("Degrees", "^{\\circ}"),
      t("Congruent to", "\\cong"),
      t("Similar to", "\\sim"),
      t("Line segment", `\\overline{${B}}`),
      t("Vector from point to point", `\\overrightarrow{${B}}`),
      t("Arc", `\\overset{\\frown}{${B}}`),
    ],
  },
  {
    id: "functions",
    label: "Trigonometry & calculus",
    templates: [
      t("Sine", `\\sin ${B}`),
      t("Cosine", `\\cos ${B}`),
      t("Tangent", `\\tan ${B}`),
      t("Inverse sine", `\\sin^{-1} ${B}`),
      t("Inverse cosine", `\\cos^{-1} ${B}`),
      t("Inverse tangent", `\\tan^{-1} ${B}`),
      t("Limit", `\\lim_{${B}\\to ${B}} ${B}`),
      t("Summation", `\\sum_{${B}}^{${B}} ${B}`),
      t("Product", `\\prod_{${B}}^{${B}} ${B}`),
      t("Definite integral", `\\int_{${B}}^{${B}} ${B}\\,d${B}`),
      t("Indefinite integral", `\\int ${B}\\,d${B}`),
      t("Derivative", `\\frac{d${B}}{d${B}}`),
      t("Partial derivative", `\\frac{\\partial ${B}}{\\partial ${B}}`),
    ],
  },
  {
    id: "chemistry",
    label: "Chemistry & units",
    templates: [
      t("Chemical formula", `\\ce{${B}}`),
      t("Water", "\\ce{H2O}"),
      t("Carbon dioxide", "\\ce{CO2}"),
      t("Reaction: hydrogen and oxygen", "\\ce{2H2 + O2 -> 2H2O}"),
      t("Reaction arrow", `\\ce{${B} -> ${B}}`),
      t("Reversible reaction", `\\ce{${B} <=> ${B}}`),
      t("Ion with charge", `\\ce{${B}^{2+}}`),
      t("Physical quantity with unit", `\\pu{${B}}`),
      t("Metres per second squared", "\\pu{m s-2}"),
      t("Avogadro relationship", "N = nN_A"),
    ],
  },
];

export const ALL_TEMPLATES = EQUATION_CATEGORIES.flatMap((c) => c.templates);
