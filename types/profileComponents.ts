export interface ProfileHeaderProps {
    displayName: string | null;
  }

  
export interface ProfileItemProps {
    label: string;
    value: string | number | null;
    isLastItem?: boolean;
  }

export interface SectionHeaderProps {
    title: string;
  }
  
export interface ProfileGroupProps {
    data: Record<string, any>;
    onEdit?: (fieldKey: string, currentValue: string, displayName: string) => void;
    nonEditableFields?: string[];
    }

export interface ProfileSectionProps {
  title: string;
  data: Record<string, any>;
}

  