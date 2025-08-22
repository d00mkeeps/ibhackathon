import React from "react";
import { Modal, TouchableOpacity } from "react-native";

interface BaseModalProps {
  isVisible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  widthPercent?: number;
  heightPercent?: number;
}

export default function BaseModal({
  isVisible,
  onClose,
  children,
  widthPercent = 90,
  heightPercent = 55,
}: BaseModalProps) {
  return (
    <Modal
      visible={isVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.8)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={{
            width: `${widthPercent}%`,
            height: `${heightPercent}%`,
            backgroundColor: "#231f20",
            borderRadius: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
          activeOpacity={1}
          onPress={() => {}}
        >
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}
