import { companyService } from "@/services/api/companyService";
import { ConversationModal } from "@/components/organisms/ConversationModal"; // Add this import
import React, { useState, useRef } from "react";
import { Stack, Button, Text } from "tamagui";
import CompanySearchInput from "@/components/molecules/CompanySearchInput";

// Add interface for conversation type
interface Conversation {
  id: string;
  name: string;
  created_at: string;
}

export default function HomeScreen() {
  const [companyName, setCompanyName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const handleProcessCompany = async () => {
    if (!companyName.trim()) return;
    setIsProcessing(true);
    try {
      console.log("=== DEBUGGING COMPANY REQUEST ===");
      console.log("Company name:", companyName);
      const result = await companyService.processCompany(companyName);
      if (result.success && result.conversation_id) {
        console.log("Company processed successfully!", result);

        // Create conversation object from API response
        const conversation: Conversation = {
          id: result.conversation_id,
          name: result.company_name || companyName,
          created_at: result.processed_at || new Date().toISOString(),
        };

        // Open the conversation modal
        setSelectedConversation(conversation);
        setIsModalOpen(true);
      } else {
        console.error("Failed to process company:", result.error);
      }
      setCompanyName("");
    } catch (error) {
      console.error("=== ERROR CAUGHT ===");
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickSelect = async (company: string) => {
    setCompanyName(company);
    setIsProcessing(true);
    try {
      console.log("=== QUICK SELECT DEBUGGING ===");
      console.log("Company name:", company);
      const result = await companyService.processCompany(company);
      if (result.success && result.conversation_id) {
        console.log("Company processed successfully!", result);

        // Create conversation object from API response
        const conversation: Conversation = {
          id: result.conversation_id,
          name: result.company_name || company,
          created_at: result.processed_at || new Date().toISOString(),
        };

        // Open the conversation modal
        setSelectedConversation(conversation);
        setIsModalOpen(true);
      } else {
        console.error("Failed to process company:", result.error);
      }
      setCompanyName("");
    } catch (error) {
      console.error("=== ERROR CAUGHT ===");
      console.error("Error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  const quickOptions = ["Adobe", "Nvidia", "Cipher Mining"];

  return (
    <Stack flex={1} flexDirection="row" backgroundColor="$background">
      {/* Conversations Sidebar */}

      {/* Main Content */}
      <Stack flex={1} padding="$4" justifyContent="center">
        <Stack
          space="$4"
          alignItems="center"
          maxWidth={400}
          alignSelf="center"
          width="100%"
        >
          <Text fontSize="$12" fontWeight="bold" color="red">
            CARP
          </Text>
          <Text fontSize="$6" fontWeight="bold" color="red">
            (Company analysis research partner)
          </Text>
          <Text fontSize="$6" fontWeight="bold" color="$color">
            Please enter a company name
          </Text>

          <Stack
            flexDirection="row"
            space="$3"
            alignItems="center"
            width="100%"
          >
            <CompanySearchInput
              value={companyName}
              onSelect={(selectedCompany) => {
                setCompanyName(selectedCompany);
                handleProcessCompany();
              }}
              placeholder="Search companies..."
            />
            <Button
              size="$4"
              width={50}
              height={50}
              borderRadius="$3"
              onPress={handleProcessCompany}
              disabled={!companyName.trim() || isProcessing}
              backgroundColor="$blue10"
              pressStyle={{ backgroundColor: "$blue11" }}
            >
              <Text fontSize="$5" color="white">
                →
              </Text>
            </Button>
          </Stack>

          {/* Quick selection buttons */}
          <Stack
            flexDirection="row"
            space="$2"
            alignItems="center"
            width="100%"
            justifyContent="center"
          >
            <Text fontSize="$3" color="$color" opacity={0.7}>
              Quick select:
            </Text>
            {quickOptions.map((company) => (
              <Button
                key={company}
                size="$2"
                backgroundColor="$gray8"
                borderRadius="$2"
                onPress={() => handleQuickSelect(company)}
                disabled={isProcessing}
                pressStyle={{ backgroundColor: "$gray9" }}
              >
                <Text fontSize="$2" color="white">
                  {company}
                </Text>
              </Button>
            ))}
          </Stack>
        </Stack>
      </Stack>

      {/* Conversation Modal */}
      <ConversationModal
        isOpen={isModalOpen}
        conversation={selectedConversation}
        onClose={handleModalClose}
      />
    </Stack>
  );
}
