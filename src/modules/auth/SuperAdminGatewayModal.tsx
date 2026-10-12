import React from 'react';
import {
  EnvironmentSelectorModal,
  type EnvironmentSelectorProps,
} from './EnvironmentSelectorModal';

export type SuperAdminGatewayModalProps = EnvironmentSelectorProps;

export const SuperAdminGatewayModal: React.FC<SuperAdminGatewayModalProps> = (props) => {
  return <EnvironmentSelectorModal {...props} />;
};

export { EnvironmentSelectorModal };
