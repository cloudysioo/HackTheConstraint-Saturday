
# MedTrace
*Flag it, Never Decide.*

**Medication continuity and safe handover across every patient visit.**
 

## > Overview

**MedTrace** is an intelligent healthcare safety platform designed to address medication discrepancies when patients transition between primary care (GPs), hospitals, and pharmacies.

Unlike automated systems that attempt to resolve conflicts programmatically or silently overwrite medical records, MedTrace follows a strict **"Flag, Never Decide"** philosophy. The system identifies discrepancies, surfaces critical context, and queues actionable flags for healthcare professionals (pharmacists and doctors) to review and approve.



## > The Problem: "The Forgotten Prescription"

When a patient moves across healthcare environments, each provider maintains isolated medical logs:

|Name|Date|Medicine|mg|Frequency|
|:-:|:-:|:-:|:-:|:-:|
|GP Clinic|12 Jan|Metformin|500|twice daily|
|Hospital|3 Mar|Metformin|850|twice daily|
|Hospital|20 Mar|Metformin|500|Missing|



**The Risk:** Mismatched records lead to adverse drug events (ADEs), duplicate therapy, missed medications, or dangerous toxicity.
**The Dilemma:** Which entry is active and correct? Patients are often left carrying this risk without clear, verified guidance.



## > Core Principles

1. **Flag, Never Decide:** AI and automated rules only extract, align, and explain data—they *never* make clinical decisions.
2. **Preserve Source Integrity:** The original prescriber wording is never altered or deleted. Data points remain tied to their source documents.
3. **Clinician-in-the-Loop:** Unresolved discrepancies are routed to qualified pharmacists or clinicians for verification.
4. **Immutable Audit Trails:** Every flag, action, and confirmation is logged sequentially with cryptographic hashing for full accountability.



## > How It Works

|Step 1|Step 2|Step 3|Step 4|Step 5|
|:-:|:-:|:-:|:-:|:-:|
|Prescription & discharge docs to structured data fields|Align drugs by name, dose, date, and instructions|Rules engine marks gaps & conflicts|Pharmacists & doctors approves or annotes|Patient views plain language + original texts



1. **Extract:** Parse incoming PDF prescriptions or hospital summaries into structured fields using OCR and NLP.
2. **Compare:** Cross-reference medications across all historical visits.
3. **Flag:** Deterministic rule engines flag dosage changes, missing medications, or stale prescriptions.
4. **Review:** Healthcare providers process the review queue, confirming or clarifying active dosages.
5. **Share:** Verified, plain-language medication summaries are presented to the patient alongside original untouched text.



## > Flag Severity Classification

|Severity|Type|Description|Example|
|:-:|:-:|-|-|
|**HIGH**|🔴 **Conflict**|Differing strengths, doses, or frequencies across visits|Metformin: 500 mg (GP) vs 850 mg (Hospital)|
|**MEDIUM**|🟠 **Missing Entry**|A drug listed in previous visits disappears without an explicit stop order|Amlodipine present in GP \& Pharmacy records, omitted at discharge|
|**MEDIUM**|🟠 **Outdated**|Time-limited therapy still shown as active after the intended end date|7-day Amoxicillin course active 2 months post-prescription|
|**LOW**|🔵 **Name Variant**|Brand vs. Generic name alignment needing quick confirmation|*Glucophage* matched with *Metformin*|



## > Getting Started 

### &#x20;- Installation

1. **Clone the Repository**

```bash
   git clone https://github.com/your-org/MedTrace.git
   cd MedTrace
   ```

2. **Backend Setup**

```bash
   # Navigate to server directory
   cd server

   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate

   # Install dependencies
   pip install -r requirements.txt

   # Run backend server
   uvicorn main:app --reload
   ```

3. **Frontend Setup**

```bash
   # Open a new terminal and navigate to client directory
   cd client

   # Install Node packages
   npm install

   # Start development server
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:3000`.


## > Security \& Compliance

* **HIPAA \& GDPR Awareness:** Built around privacy-by-design principles, decoupling PII from medical data extraction models.
* **Tamper-Evident Logs:** Append-only audit histories preserve accountability across all human and machine interactions.
* **Data Minimization:** AI handles structural extraction only and is restricted from generating autonomous medical decisions.
* **Authentications and Verification:** Password Stored SHA-256 hashed via Web Crypto API- format $hash$<hex>. Never stored in raw.


## > Team Members

* **Anik Panda**
* **Kushagra Sinha**
* **Vaibhav Singh**
* **Tridip Bhattacharjee**

