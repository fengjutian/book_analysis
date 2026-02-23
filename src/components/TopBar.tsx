import { ReactNode } from 'react';

interface TopBarProps {
  children?: ReactNode;
}

const TopBar: React.FC<TopBarProps> = ({ children }) => (
  <div className="top-bar">
    {children}
  </div>
);

export default TopBar;
