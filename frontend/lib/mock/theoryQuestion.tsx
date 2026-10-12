import { Question } from "@/types/examsTypes";

export const essayQuestions: Question[] = [
  {
    id: 1,
    title: "Newton's Laws of Motion and Applications",
    subQuestions: [
      {
        id: "1a",
        label: "(a)",
        text: "State Newton's three laws of motion.",
        marks: 6,
        modelAnswer:
          "1st Law (Inertia): A body remains at rest or in uniform motion unless acted upon by an external force.\n2nd Law: The rate of change of momentum is proportional to the applied force and acts in its direction; F = ma.\n3rd Law: For every action there is an equal and opposite reaction.",
      },
      {
        id: "1b",
        label: "(b)",
        text: "A car of mass 1200 kg accelerates from rest to 20 m/s in 8 seconds. Calculate the force exerted by the engine (ignore friction).",
        marks: 8,
        modelAnswer:
          "Using F = ma, first find acceleration:\na = (v - u)/t = (20 - 0)/8 = 2.5 m/s²\nThen F = ma = 1200 × 2.5 = 3000 N",
      },
      {
        id: "1c",
        label: "(c)",
        text: "(i) Define impulse. (ii) A force of 50 N acts on a body for 0.2 seconds. Calculate the impulse.",
        marks: 6,
        modelAnswer:
          "(i) Impulse is the product of force and the time for which it acts. J = F × t. It equals the change in momentum of the body.\n(ii) J = F × t = 50 × 0.2 = 10 Ns",
      },
    ],
  },
  {
    id: 2,
    title: "Thermodynamics and Heat Transfer",
    // imageUrl: "/questions/thermo-diagram.png",  ← example of question image
    subQuestions: [
      {
        id: "2a",
        label: "(a)",
        text: "Explain the three methods of heat transfer, giving one example of each.",
        marks: 10,
        modelAnswer:
          "1. Conduction: Transfer of heat through a material by direct contact without bulk movement. Example: Heat along a metal rod.\n2. Convection: Transfer by bulk movement of a fluid (liquid or gas). Example: Boiling water — hot water rises, cool water sinks.\n3. Radiation: Transfer by electromagnetic waves without needing a medium. Example: Heat from the Sun reaching Earth.",
      },
      {
        id: "2b",
        label: "(b)",
        text: "A metal rod of length 0.5 m has a temperature difference of 100°C between its ends. If the thermal conductivity is 200 W/mK and cross-sectional area is 0.01 m², calculate the rate of heat transfer.",
        marks: 10,
        modelAnswer:
          "Using Fourier's Law: Q/t = kA(ΔT/L)\nQ/t = 200 × 0.01 × (100/0.5)\nQ/t = 200 × 0.01 × 200\nQ/t = 400 W",
      },
    ],
  },
];
