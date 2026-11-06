# Hospital Emergency Management Under Uncertainty

An interactive stochastic modeling project combining **Queueing Theory (M/M/c)**, **Inventory Management (s*, Q*)**, and **Monte Carlo Simulation** to study resource allocation and operational optimization in hospital emergency departments.

## Overview

Hospital emergency departments operate under uncertain conditions: patient arrivals fluctuate, treatment durations vary, and medical supplies must remain available despite unpredictable demand.

This project explores how stochastic models can support hospital resource management by combining two complementary approaches:

- **Queueing Theory (M/M/c):** Optimizing the number of medical staff required to minimize patient waiting times while controlling staffing costs.
- **Inventory Management (s*, Q*):** Determining optimal replenishment thresholds and order quantities to reduce inventory and shortage costs.

An interactive simulation environment allows users to modify model parameters, observe their impact, and compare theoretical results with simulation outcomes.

## Project Objectives

- Model patient arrivals using a Poisson process.
- Represent medical service durations using an exponential distribution.
- Determine the optimal number of medical servers (doctors).
- Calculate waiting probabilities and expected waiting times.
- Optimize medical inventory replenishment policies.
- Simulate stochastic events using Monte Carlo methods.
- Compare analytical results with simulated performance.
- Understand the limitations and assumptions of stochastic models in healthcare.

## Mathematical Models

### 1. M/M/c Queueing Model

The M/M/c model represents a queueing system with:

- Poisson-distributed patient arrivals.
- Exponentially distributed service durations.
- Multiple parallel servers (doctors).
- A shared waiting queue.

**Main parameters**

| Symbol | Description |
|---|---|
| λ | Average patient arrival rate (patients/hour) |
| μ | Average service rate per doctor (patients/hour) |
| c | Number of available doctors |
| a = λ/μ | Offered traffic in Erlangs |
| ρ = λ/(cμ) | Server utilization rate |

The system is stable when:

\[
\rho < 1
\]

**Key performance indicators**

The application calculates:

- Probability that an arriving patient must wait (Erlang C).
- Average waiting time in the queue.
- Average total time spent in the system.
- Average number of patients in the system (Little's Law).
- Estimated total operational cost.

The objective is to identify the optimal staffing level \(c^*\), balancing waiting costs and staffing expenses.

### 2. Inventory Management Model (s*, Q*)

The inventory component uses a continuous-review replenishment policy.

Two decision variables are calculated:

**Reorder Point (s*)**

\[
s^* = \mu_D L + z_\alpha \sigma_D \sqrt{L}
\]

Where:

- μ_D: Average daily medical supply demand.
- L: Delivery lead time in days.
- σ_D: Standard deviation of daily demand.
- z_α: Normal distribution quantile corresponding to the target service level.

**Economic Order Quantity (Q*)**

\[
Q^* = \sqrt{\frac{2K\mu_D}{h}}
\]

Where:

- K: Fixed ordering cost.
- μ_D: Average daily demand.
- h: Inventory holding cost per unit per day.

The model determines:
- Optimal reorder threshold.
- Economic order quantity.
- Safety stock.
- Expected number of annual orders.
- Estimated annual inventory costs.

## Application Features

The application is organized into eight interactive sections.

| Section | Description |
|---|---|
| Introduction | Project overview and main concepts |
| Problem | Explanation of input variables and performance indicators |
| Model | Mathematical foundations of the M/M/c and inventory models |
| Queueing System | Interactive staffing optimization and cost analysis |
| Inventory | Interactive calculation of optimal inventory policies |
| Simulation | Event-driven Monte Carlo simulation |
| Synthesis | Combined decision-making and optimal resource allocation |
| Limitations | Model assumptions, limitations, and possible extensions |

### Interactive Queueing Analysis

Users can modify:
- Patient arrival rate (λ).
- Doctor service rate (μ).
- Number of doctors (c).
- Waiting cost.
- Staffing cost.

The application dynamically recalculates system performance and displays cost comparisons for different staffing configurations.

### Interactive Inventory Analysis

Users can adjust:
- Average daily demand.
- Demand variability.
- Delivery lead time.
- Target service level.
- Ordering cost.
- Holding cost.

The application updates the optimal replenishment policy and visualizes the relationship between ordering costs, holding costs, and total inventory costs.

### Monte Carlo Simulation

The project includes an event-driven simulation of the M/M/c queueing system.

It models two types of events:

- **Arrival events:** Patients enter the system according to an exponential inter-arrival time distribution.
- **Departure events:** Doctors complete treatments according to exponential service durations.

Patients are either assigned immediately to an available doctor or added to a FIFO waiting queue.

The simulation produces:
- Average simulated waiting time.
- Theoretical waiting time calculated using Erlang C.
- Number of patients served.
- Doctor utilization rate.
- Evolution of the queue over simulation time.

The simulated waiting time is compared with the theoretical result to examine the consistency of the model.

## Technology Stack

- **React** – Interactive user interface.
- **JavaScript** – Mathematical calculations and simulation logic.
- **Recharts** – Dynamic charts and data visualization.
- **CSS-in-JS** – Component styling and design system.

## Installation and Setup

### Prerequisites

- Node.js and npm.
- A React application.

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

### 2. Install dependencies

```bash
npm install
npm install recharts
```

### 3. Add the application component

Place the project source code inside your React application's component structure and import it into your main application entry point.

For example:

```jsx
import App from "./App";

export default function Main() {
  return <App />;
}
```

### 4. Run the application

```bash
npm run dev
```

The application will be available at the local development URL provided by your React development server.

## Model Assumptions and Limitations

The project uses simplified assumptions to make the mathematical models understandable and computationally manageable.

Some limitations include:

- Constant patient arrival rate.
- Exponentially distributed treatment durations.
- Homogeneous patient populations.
- No explicit priority-based queueing.
- Simplified inventory demand assumptions.
- Fixed delivery lead time.
- Independent analytical treatment of queueing and inventory components.

These assumptions do not fully represent the complexity of real hospital operations.

## Possible Future Improvements

- Introduce time-dependent patient arrival rates.
- Implement priority-based queueing systems.
- Integrate stochastic delivery lead times.
- Couple patient flows with medical inventory consumption.
- Explore Markov Decision Processes (MDP).
- Apply reinforcement learning for dynamic resource allocation.
- Extend the simulation to more complex hospital scenarios.

## Academic Context

This project was developed as part of an academic study of **Stochastic Systems**, focusing on the application of probability theory, queueing systems, inventory optimization, and simulation techniques to healthcare resource management.

The objective is to demonstrate how mathematical modeling and computational simulation can help analyze operational uncertainty and support resource allocation decisions.

---

**Topics:** Stochastic Processes · Queueing Theory · M/M/c · Erlang C · Inventory Management · Economic Order Quantity · Monte Carlo Simulation · Operations Research · Healthcare Optimization
