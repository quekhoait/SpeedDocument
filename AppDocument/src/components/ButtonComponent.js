import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';

const variantStyles = {
  primary: {
    backgroundColor: '#2563eb',
    textColor: '#ffffff',
  },
  secondary: {
    backgroundColor: '#6b7280',
    textColor: '#ffffff',
  },
  danger: {
    backgroundColor: '#dc2626',
    textColor: '#ffffff',
  },
};

const ButtonComponent = ({
  title = 'Button',
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  backgroundColor,
  textColor,
  style,
  textStyle,
}) => {
  const variantStyle = variantStyles[variant] || variantStyles.primary;
  const buttonBackground = backgroundColor || variantStyle.backgroundColor;
  const buttonTextColor = textColor || variantStyle.textColor;
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor: buttonBackground, opacity: isDisabled ? 0.7 : 1 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={buttonTextColor} />
      ) : (
        <Text style={[styles.text, { color: buttonTextColor }, textStyle]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 0,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ButtonComponent;