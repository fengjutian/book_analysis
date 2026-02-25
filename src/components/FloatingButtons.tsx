import React from 'react';
import {
  CommentOutlined,
  DownOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { FloatButton } from 'antd';

const BOX_SIZE = 100;
const BUTTON_SIZE = 40;

const containerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 20,
  right: 20,
  width: BOX_SIZE,
  height: BOX_SIZE,
  zIndex: 1000,
};

const insetInlineEnd: React.CSSProperties['insetInlineEnd'][] = [
  (BOX_SIZE - BUTTON_SIZE) / 2,
  -(BUTTON_SIZE / 2),
  (BOX_SIZE - BUTTON_SIZE) / 2,
  BOX_SIZE - BUTTON_SIZE / 2,
];

const bottom: React.CSSProperties['bottom'][] = [
  BOX_SIZE - BUTTON_SIZE / 2,
  (BOX_SIZE - BUTTON_SIZE) / 2,
  -BUTTON_SIZE / 2,
  (BOX_SIZE - BUTTON_SIZE) / 2,
];

const icons = [
  <UpOutlined key="up" />,
  <RightOutlined key="right" />,
  <DownOutlined key="down" />,
  <LeftOutlined key="left" />,
];

const FloatingButtons: React.FC = () => (
  <div style={containerStyle}>
    {(['top'] as const).map((placement, i) => {
      const style: React.CSSProperties = {
        position: 'absolute',
        insetInlineEnd: insetInlineEnd[i],
        bottom: bottom[i],
      };
      return (
        <FloatButton.Group
          key={placement}
          trigger="click"
          placement={placement}
          style={style}
          icon={icons[i]}
        >
          <FloatButton />
          <FloatButton icon={<CommentOutlined />} />
        </FloatButton.Group>
      );
    })}
  </div>
);

export default FloatingButtons;