# Quantum Mathematics: Superdense Coding Specification

This document details the mathematical framework, algebraic conventions, and invariants of the Quantum Superdense Coding Simulator.

---

## 1. Mathematical Conventions

- **Computational Basis Ordering**:
  $$|q_0 q_1\rangle$$
  where $q_0$ is the left-most / most significant bit (Alice's qubit), and $q_1$ is the right-most / least significant bit (Bob's qubit).
  $$\{|00\rangle, |01\rangle, |10\rangle, |11\rangle\}$$

- **State Vector Representation**:
  Four-dimensional complex vector $\mathbf{\psi} = [\alpha, \beta, \gamma, \delta]^T \in \mathbb{C}^4$:
  $$|\psi\rangle = \alpha |00\rangle + \beta |01\rangle + \gamma |10\rangle + \delta |11\rangle$$

- **Normalization Invariant**:
  $$\sum_{i=0}^3 |c_i|^2 = 1.0 \pm 10^{-9}$$

---

## 2. Gate Definitions

### 2.1 Single-Qubit Gates
$$I = \begin{pmatrix} 1 & 0 \\ 0 & 1 \end{pmatrix}, \quad H = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & 1 \\ 1 & -1 \end{pmatrix}$$
$$X = \begin{pmatrix} 0 & 1 \\ 1 & 0 \end{pmatrix}, \quad Z = \begin{pmatrix} 1 & 0 \\ 0 & -1 \end{pmatrix}$$

### 2.2 Two-Qubit CNOT Gate (Control $q_0$, Target $q_1$)
$$\text{CNOT}_{01} = \begin{pmatrix}
1 & 0 & 0 & 0 \\
0 & 1 & 0 & 0 \\
0 & 0 & 0 & 1 \\
0 & 0 & 1 & 0
\end{pmatrix}$$

---

## 3. Step-by-Step Protocol Progression

### Step 0: Ground State
$$|\psi_0\rangle = |00\rangle = [1, 0, 0, 0]^T$$

### Step 1: Alice Prepares Superposition
Apply Hadamard to $q_0$:
$$|\psi_1\rangle = (H \otimes I)|00\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |10\rangle) = \left[\frac{1}{\sqrt{2}}, 0, \frac{1}{\sqrt{2}}, 0\right]^T$$

### Step 2: Entanglement Generation via CNOT
$$\text{CNOT}_{01}|\psi_1\rangle = |\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle) = \left[\frac{1}{\sqrt{2}}, 0, 0, \frac{1}{\sqrt{2}}\right]^T$$
Probabilities: $P(00) = 0.5, P(01) = 0.0, P(10) = 0.0, P(11) = 0.5$.

### Step 3: Alice's Encoding Transformation
Alice applies local unitary $U_A$ to $q_0$:
- **Message 00**: $U_A = I$
  $$|\psi_3\rangle = (I \otimes I)|\Phi^+\rangle = |\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle + |11\rangle)$$
- **Message 01**: $U_A = X$ (Bit Flip)
  $$|\psi_3\rangle = (X \otimes I)|\Phi^+\rangle = |\Psi^+\rangle = \frac{1}{\sqrt{2}}(|01\rangle + |10\rangle)$$
- **Message 10**: $U_A = Z$ (Phase Flip)
  $$|\psi_3\rangle = (Z \otimes I)|\Phi^+\rangle = |\Phi^-\rangle = \frac{1}{\sqrt{2}}(|00\rangle - |11\rangle)$$
- **Message 11**: $U_A = X \cdot Z$ (Phase Flip then Bit Flip)
  $$|\psi_3\rangle = (X \cdot Z \otimes I)|\Phi^+\rangle = \frac{1}{\sqrt{2}}(-|01\rangle + |10\rangle)$$

### Step 4: Transmission
Alice sends $q_0$ to Bob across the physical quantum channel. The state vector is invariant.

### Step 5: Bob Decodes - Step 1 (CNOT)
Bob applies $\text{CNOT}_{01}$:
- For 00: $\frac{1}{\sqrt{2}}(|00\rangle + |10\rangle) = \frac{|0\rangle+|1\rangle}{\sqrt{2}} \otimes |0\rangle$
- For 01: $\frac{1}{\sqrt{2}}(|01\rangle + |11\rangle) = \frac{|0\rangle+|1\rangle}{\sqrt{2}} \otimes |1\rangle$
- For 10: $\frac{1}{\sqrt{2}}(|00\rangle - |10\rangle) = \frac{|0\rangle-|1\rangle}{\sqrt{2}} \otimes |0\rangle$
- For 11: $\frac{1}{\sqrt{2}}(-|01\rangle + |11\rangle) = -\frac{|0\rangle-|1\rangle}{\sqrt{2}} \otimes |1\rangle$

Target qubit $q_1$ is now completely disentangled and set to the second classical bit.

### Step 6: Bob Decodes - Step 2 (Hadamard on $q_0$)
- For 00: $|00\rangle$
- For 01: $|01\rangle$
- For 10: $|10\rangle$
- For 11: $-|11\rangle$

### Step 7: Measurement
Projective measurement in computational basis yields outcome matching Alice's classical message with probability $P = 1.0 \pm 10^{-7}$.
