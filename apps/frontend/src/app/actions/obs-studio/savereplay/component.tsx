import * as React from 'react';

import { Icon, Stop, OBS } from '@lunchpad/icons';
import { Split, Child } from '@lunchpad/base';

import Pill from '../../pill'
import { OBSSaveReplay } from './classes';

interface IOBSSaveReplayPill {
  action: OBSSaveReplay
  expanded?: boolean
  onChange?: (action: OBSSaveReplay) => void
  onRemove?: (id: string) => void
  onMoveUp: (id: string) => void
  onMoveDown: (id: string) => void
}

export const OBSSaveReplayPill: React.SFC<IOBSSaveReplayPill> = (props) => {
  const Expanded = (
    <Split direction="row">
      <Child grow whiteSpace="nowrap" padding="0 1rem 0 0"><div style={{textOverflow: "ellipsis", overflow: "hidden"}}>OBS: Save replay buffer</div></Child>
    </Split>
  )
    
  return (
    <Pill
      isExpanded={false}
      expandable={false}
      icon={<Icon icon={OBS} />}
      expanded={Expanded}
      collapsed={Expanded}
      onRemove={() => props.onRemove(props.action.id)}
      onMoveUp={props.onMoveUp ? () => props.onMoveUp(props.action.id) : null}
      onMoveDown={props.onMoveDown ? () => props.onMoveDown(props.action.id) : null}
      onExpand={() => {}}
      onCollapse={() => {}}
    />
  )
}

OBSSaveReplayPill.defaultProps = {
  expanded: false,
  onChange: () => {},
  onRemove: () => {},
}