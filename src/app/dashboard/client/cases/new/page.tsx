"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/utils/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { ArrowLeft, ArrowRight, FileText, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface FormData {
  // Creditor Information
  creditorName: string;
  creditorRegNumber: string;
  creditorContactPerson: string;
  creditorEmail: string;
  creditorPhone: string;
  creditorAddress: string;
  creditorPostalAddress: string;
  
  // Debtor Information
  debtorName: string;
  debtorRegNumber: string;
  debtorAddress: string;
  debtorPhone: string;
  debtorEmail: string;
  debtorBusinessType: string;
  
  // Debt Details
  principalAmount: number;
  currency: string;
  interestRate: number;
  accruedInterest: number;
  originalDueDate: string;
  paymentTerms: string;
  debtCategory: string;
  
  // Case Details
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  preferredRecoveryMethod: string;
  previousAttempts: string;
  specialInstructions: string;
  preferredCommunication: string;
}

const initialFormData: FormData = {
  creditorName: "",
  creditorRegNumber: "",
  creditorContactPerson: "",
  creditorEmail: "",
  creditorPhone: "",
  creditorAddress: "",
  creditorPostalAddress: "",
  debtorName: "",
  debtorRegNumber: "",
  debtorAddress: "",
  debtorPhone: "",
  debtorEmail: "",
  debtorBusinessType: "",
  principalAmount: 0,
  currency: "GHS",
  interestRate: 0,
  accruedInterest: 0,
  originalDueDate: "",
  paymentTerms: "",
  debtCategory: "",
  title: "",
  description: "",
  priority: "MEDIUM",
  preferredRecoveryMethod: "",
  previousAttempts: "",
  specialInstructions: "",
  preferredCommunication: "EMAIL",
};

export default function NewCasePage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const createCaseMutation = api.case.create.useMutation({
    onSuccess: (data) => {
      router.push(`/dashboard/client/cases/${data.id}`);
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.creditorName) newErrors.creditorName = "Creditor name is required";
      if (!formData.creditorEmail) newErrors.creditorEmail = "Creditor email is required";
      if (!formData.creditorPhone) newErrors.creditorPhone = "Creditor phone is required";
      if (!formData.creditorAddress) newErrors.creditorAddress = "Creditor address is required";
    } else if (step === 2) {
      if (!formData.debtorName) newErrors.debtorName = "Debtor name is required";
      if (!formData.debtorAddress) newErrors.debtorAddress = "Debtor address is required";
    } else if (step === 3) {
      if (!formData.principalAmount || formData.principalAmount <= 0) {
        newErrors.principalAmount = "Principal amount must be greater than 0";
      }
      if (!formData.originalDueDate) newErrors.originalDueDate = "Original due date is required";
      if (!formData.debtCategory) newErrors.debtCategory = "Debt category is required";
    } else if (step === 4) {
      if (!formData.title) newErrors.title = "Case title is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      await createCaseMutation.mutateAsync({
        ...formData,
        originalDueDate: new Date(formData.originalDueDate),
      });
    } catch (error) {
      console.error("Error creating case:", error);
    }
  };

  const steps = [
    { number: 1, title: "Creditor Information", description: "Details about the creditor" },
    { number: 2, title: "Debtor Information", description: "Details about the debtor" },
    { number: 3, title: "Debt Details", description: "Amount and debt information" },
    { number: 4, title: "Case Details", description: "Case description and preferences" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/client/cases" className="flex items-center text-blue-600 hover:text-blue-800 mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cases
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">File New Debt Recovery Case</h1>
          <p className="text-gray-600">Complete the form to submit your debt recovery case</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 
                  ${currentStep >= step.number 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-500'
                  }
                `}>
                  {currentStep > step.number ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>
                <div className="ml-3 min-w-0">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-20 h-0.5 mx-4
                    ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Form Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep - 1]?.title || "Case Filing"}</CardTitle>
          <CardDescription>{steps[currentStep - 1]?.description || "Please fill out the form below"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {errors.general && (
            <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-md">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{errors.general}</span>
            </div>
          )}

          {/* Step 1: Creditor Information */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Creditor Name *
                </label>
                <Input
                  value={formData.creditorName}
                  onChange={(e) => handleInputChange("creditorName", e.target.value)}
                  placeholder="Company or individual name"
                />
                {errors.creditorName && <p className="text-red-500 text-sm mt-1">{errors.creditorName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <Input
                  value={formData.creditorRegNumber}
                  onChange={(e) => handleInputChange("creditorRegNumber", e.target.value)}
                  placeholder="Business registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person
                </label>
                <Input
                  value={formData.creditorContactPerson}
                  onChange={(e) => handleInputChange("creditorContactPerson", e.target.value)}
                  placeholder="Primary contact person"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.creditorEmail}
                  onChange={(e) => handleInputChange("creditorEmail", e.target.value)}
                  placeholder="contact@company.com"
                />
                {errors.creditorEmail && <p className="text-red-500 text-sm mt-1">{errors.creditorEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <Input
                  value={formData.creditorPhone}
                  onChange={(e) => handleInputChange("creditorPhone", e.target.value)}
                  placeholder="+233 XXX XXX XXX"
                />
                {errors.creditorPhone && <p className="text-red-500 text-sm mt-1">{errors.creditorPhone}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Physical Address *
                </label>
                <Textarea
                  value={formData.creditorAddress}
                  onChange={(e) => handleInputChange("creditorAddress", e.target.value)}
                  placeholder="Complete physical address"
                  rows={3}
                />
                {errors.creditorAddress && <p className="text-red-500 text-sm mt-1">{errors.creditorAddress}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Address
                </label>
                <Textarea
                  value={formData.creditorPostalAddress}
                  onChange={(e) => handleInputChange("creditorPostalAddress", e.target.value)}
                  placeholder="P.O. Box address (if different from physical)"
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Debtor Information */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debtor Name *
                </label>
                <Input
                  value={formData.debtorName}
                  onChange={(e) => handleInputChange("debtorName", e.target.value)}
                  placeholder="Individual or company name"
                />
                {errors.debtorName && <p className="text-red-500 text-sm mt-1">{errors.debtorName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <Input
                  value={formData.debtorRegNumber}
                  onChange={(e) => handleInputChange("debtorRegNumber", e.target.value)}
                  placeholder="Business registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <Input
                  value={formData.debtorPhone}
                  onChange={(e) => handleInputChange("debtorPhone", e.target.value)}
                  placeholder="+233 XXX XXX XXX"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  value={formData.debtorEmail}
                  onChange={(e) => handleInputChange("debtorEmail", e.target.value)}
                  placeholder="debtor@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Type
                </label>
                <select
                  value={formData.debtorBusinessType}
                  onChange={(e) => handleInputChange("debtorBusinessType", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select business type</option>
                  <option value="Individual">Individual</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Limited Company">Limited Company</option>
                  <option value="Public Company">Public Company</option>
                  <option value="NGO">NGO</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debtor Address *
                </label>
                <Textarea
                  value={formData.debtorAddress}
                  onChange={(e) => handleInputChange("debtorAddress", e.target.value)}
                  placeholder="Complete known address of the debtor"
                  rows={3}
                />
                {errors.debtorAddress && <p className="text-red-500 text-sm mt-1">{errors.debtorAddress}</p>}
              </div>
            </div>
          )}

          {/* Step 3: Debt Details */}
          {currentStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Principal Amount *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.principalAmount}
                  onChange={(e) => handleInputChange("principalAmount", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                {errors.principalAmount && <p className="text-red-500 text-sm mt-1">{errors.principalAmount}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) => handleInputChange("currency", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GHS">GHS - Ghana Cedis</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Rate (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => handleInputChange("interestRate", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accrued Interest
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.accruedInterest}
                  onChange={(e) => handleInputChange("accruedInterest", parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Original Due Date *
                </label>
                <Input
                  type="date"
                  value={formData.originalDueDate}
                  onChange={(e) => handleInputChange("originalDueDate", e.target.value)}
                />
                {errors.originalDueDate && <p className="text-red-500 text-sm mt-1">{errors.originalDueDate}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Debt Category *
                </label>
                <select
                  value={formData.debtCategory}
                  onChange={(e) => handleInputChange("debtCategory", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="Trade Debt">Trade Debt</option>
                  <option value="Service Fee">Service Fee</option>
                  <option value="Loan Repayment">Loan Repayment</option>
                  <option value="Rent">Rent</option>
                  <option value="Utility Bills">Utility Bills</option>
                  <option value="Professional Services">Professional Services</option>
                  <option value="Construction">Construction</option>
                  <option value="Other">Other</option>
                </select>
                {errors.debtCategory && <p className="text-red-500 text-sm mt-1">{errors.debtCategory}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <Textarea
                  value={formData.paymentTerms}
                  onChange={(e) => handleInputChange("paymentTerms", e.target.value)}
                  placeholder="Original payment terms agreed upon"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Step 4: Case Details */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Title *
                </label>
                <Input
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Brief descriptive title for this case"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Case Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Detailed description of the debt and circumstances"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange("priority", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preferred Communication
                  </label>
                  <select
                    value={formData.preferredCommunication}
                    onChange={(e) => handleInputChange("preferredCommunication", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMAIL">Email</option>
                    <option value="PHONE">Phone</option>
                    <option value="SMS">SMS</option>
                    <option value="PORTAL">Portal Messages</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Recovery Method
                </label>
                <Textarea
                  value={formData.preferredRecoveryMethod}
                  onChange={(e) => handleInputChange("preferredRecoveryMethod", e.target.value)}
                  placeholder="Any specific recovery methods you prefer or want to avoid"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Recovery Attempts
                </label>
                <Textarea
                  value={formData.previousAttempts}
                  onChange={(e) => handleInputChange("previousAttempts", e.target.value)}
                  placeholder="Describe any previous attempts to recover this debt"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <Textarea
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
                  placeholder="Any special considerations or instructions for this case"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-3">
              {currentStep < 4 ? (
                <Button type="button" onClick={handleNext}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={createCaseMutation.isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createCaseMutation.isLoading ? (
                    "Submitting..."
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Submit Case
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
