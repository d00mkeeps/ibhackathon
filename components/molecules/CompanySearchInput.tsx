import React, { useState, useEffect } from "react";
import { Input, YStack, Text, Stack } from "tamagui";
import { View, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COMPANY_NAMES } from "@/app/companyNames";

interface CompanySearchInputProps {
  value: string;
  onSelect: (companyName: string) => void;
  placeholder?: string;
  onValidationChange?: (isValid: boolean) => void;
}

const CompanySearchInput: React.FC<CompanySearchInputProps> = ({
  value,
  onSelect,
  placeholder = "Search companies...",
  onValidationChange,
}) => {
  const [searchText, setSearchText] = useState(value);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    setSearchText(value);
    const valid = validateCompany(value);
    setIsValid(valid);
    onValidationChange?.(valid);
  }, [value]);

  const filteredCompanies = COMPANY_NAMES.filter((company) => {
    const searchLower = searchText.toLowerCase();
    const valueMatch = company.value.toLowerCase().includes(searchLower);
    return valueMatch;
  }).slice(0, 8);

  const validateCompany = (text: string) => {
    if (!text.trim()) return false;
    // Check if text matches any company name (before parentheses) or ticker
    return COMPANY_NAMES.some((company) => {
      const companyName = company.value.split(" (")[0];
      const ticker = company.value.match(/\(([^)]+)\)/)?.[1] || "";
      return (
        companyName.toLowerCase() === text.toLowerCase() ||
        ticker.toLowerCase() === text.toLowerCase() ||
        company.value.toLowerCase() === text.toLowerCase()
      );
    });
  };

  const extractCompanyName = (fullValue: string) => {
    // Extract company name before the parentheses
    return fullValue.split(" (")[0];
  };

  const handleTextChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(text.length > 0);
    const valid = validateCompany(text);
    setIsValid(valid);
    onValidationChange?.(valid);
  };

  const handleSelectCompany = (company: (typeof COMPANY_NAMES)[0]) => {
    console.log("🎯 Company selected:", company.value);
    const companyName = extractCompanyName(company.value);
    setSearchText(companyName);
    setShowDropdown(false);
    onSelect(companyName);
  };

  const handleFocus = () => {
    if (searchText.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    // Don't hide dropdown on blur - let user tap
  };

  return (
    <YStack flex={1}>
      <Stack position="relative">
        <Input
          value={searchText}
          onChangeText={handleTextChange}
          placeholder={placeholder}
          backgroundColor="$backgroundStrong"
          borderColor={
            searchText.trim() ? (isValid ? "$green8" : "$red8") : "$borderSoft"
          }
          color="$color"
          placeholderTextColor="$textMuted"
          fontSize="$4"
          fontWeight="600"
          borderRadius="$3"
          paddingHorizontal="$3"
          paddingVertical="$2"
          paddingRight={searchText.trim() ? "$6" : "$3"}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoCorrect={false}
          autoCapitalize="words"
        />
        {searchText.trim() && (
          <Stack
            position="absolute"
            right="$2"
            top="50%"
            transform={[{ translateY: -10 }]}
            zIndex={1}
          >
            <Ionicons
              name={isValid ? "checkmark" : "close"}
              size={20}
              color={isValid ? "#22c55e" : "#ef4444"}
            />
          </Stack>
        )}
      </Stack>

      {showDropdown && filteredCompanies.length > 0 && (
        <View
          style={{
            backgroundColor: "#222",
            borderColor: "#333",
            borderWidth: 1,
            borderRadius: 12,
            marginTop: 4,
          }}
        >
          {filteredCompanies.map((company, index) => (
            <TouchableOpacity
              key={company.id}
              onPress={() => handleSelectCompany(company)}
              style={{
                padding: 12,
                borderBottomWidth: index < filteredCompanies.length - 1 ? 1 : 0,
                borderBottomColor: "#333",
                backgroundColor: "#222",
              }}
            >
              <Text color="$color" fontSize="$4" fontWeight="500">
                {company.value}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </YStack>
  );
};

export default CompanySearchInput;
