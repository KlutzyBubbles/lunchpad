import * as React from 'react';
import lodash from 'lodash';
import { deserialize } from 'typescript-json-serializer';

import { LaunchpadButton as Button } from '@lunchpad/base'
import { Icon, TriangleRight, TriangleUpSolid, TriangleDownSolid, TriangleLeftSolid, TriangleRightSolid } from '@lunchpad/icons';

import { PadContainer, ButtonLook } from '../components';
import { IPadProps, IPad } from '..';

import { MakeButtonColor } from '../helper';
import { LaunchpadButton, Page, LaunchpadButtonColorMode, LaunchpadSolidButtonColor, LaunchpadFlashingButtonColor, LaunchpadPulsingButtonColor, LaunchpadRGBButtonColor } from '../../contexts/layout/classes';
import { ControllerType } from '@lunchpad/types';

const sideButtons = {
  19: <Icon icon={TriangleRight} />,
  29: <Icon icon={TriangleRight} />,
  39: <Icon icon={TriangleRight} />,
  49: <Icon icon={TriangleRight} />,
  59: <Icon icon={TriangleRight} />,
  69: <Icon icon={TriangleRight} />,
  79: <Icon icon={TriangleRight} />,
  89: <Icon icon={TriangleRight} />,

  104: <Icon icon={TriangleUpSolid} />,
  105: <Icon icon={TriangleDownSolid} />,
  106: <Icon icon={TriangleLeftSolid} />,
  107: <Icon icon={TriangleRightSolid} />,
  108: <span>Session</span>,
  109: <span>User 1</span>,
  110: <span>User 2</span>,
  111: <span>Mixer</span>,
}

const Vendor = [0x0, 0x20, 0x29];
const Mode = [0x2, 0x18, 0x22, 0x0];

const Unload = [0x2, 0x18, 0x22, 0x2]
const Clear = [0x2, 0x18, 0x0E, 0x0]

const Solid = [0x2, 0x18, 0x0A];
const Flashing = [0x2, 0x18, 0x23];
const Pulsing = [0x2, 0x18, 0x28];
const RGB = [0x2, 0x18, 0x0B];


const XYToButton = (x: number, y: number): number => (y < 8 ) ? (y + 1) * 10 + x + 1 : 104 + x
const ButtonToXY = (note: number): [ number, number] => note < 104 ? [(note % 10) - 1, Math.floor(note / 10) - 1] : [note - 104, 8 ]

const isClip = (x: number, y: number) => {
  return (x === 8 || y === 8)
}
const Component: React.SFC<IPadProps> = (props) => (
  <PadContainer width={9} height={9}>
    {lodash.reverse(lodash.range(0, 9)).map((y) => lodash.range(0,9).map((x) => {
      const isButton = !!lodash.get(props.activePage, `buttons.${x}.${y}`, false);
      let button = new LaunchpadButton()
      try {
        let newBtn = deserialize<LaunchpadButton>(lodash.get(props.activePage, `buttons.${x}.${y}`, {}), LaunchpadButton)
        if (LaunchpadButton.isValidLaunchpadButton(newBtn)) {
          button = Object.assign(new LaunchpadButton(), newBtn);
        }
      } catch (ex) {}
      const color = MakeButtonColor(button.color)
      
      const { buttonProps } = props;

      return XYToButton(x,y) !== 112 ? (
        <Button
          x={x}
          y={y}
          color={color}
          note={{ note: XYToButton(x,y) }}
          round={isClip(x, y)}
          clip={props.showIcons && isClip(x, y)}
          key={`${x}${y}`}
          {...buttonProps}
          canDrag={isButton}
        >
          {isClip(x,y) ? props.showIcons ? sideButtons[XYToButton(x,y)] : <ButtonLook look={button.look} /> : <ButtonLook look={button.look} /> }
        </Button>
      ) : (
        <Button
          x={8}
          y={8}
          key="settings"
          note={{ note: 112 }}
          color={"#6a45ff"}
          round
          onContextMenu={lodash.noop}
          onClick={props.onSettingsButtonClick}
          canDrag={false}
        >
          SET
        </Button>
      )
    }
    ))}
  </PadContainer>
)

const initialize = (send: (code: number[], data: number[]) => void) => {
  send(Vendor, Mode);
}

const unload = (send: (code: number[], data: number[]) => void) => {
  send(Vendor, Clear);
  send(Vendor, Unload);
}

const buildColors = (send: (code: number[], data: number[]) => void, page: Page, activeButtons: Array<{x: number, y: number}>) => {
  let solids = new Array<number>();
  let flashing = new Array<number>();
  let pulsing = new Array<number>();
  let rgb = new Array<number>();

  // Build color array
  lodash.range(0, 9).map((y) => lodash.range(0,9).map((x) => {
    let button = new LaunchpadButton()
    try {
      let newBtn = deserialize<LaunchpadButton>(lodash.get(page, `buttons.${x}.${y}`, {}), LaunchpadButton)
      if (LaunchpadButton.isValidLaunchpadButton(newBtn)) {
        button = Object.assign(new LaunchpadButton(), newBtn);
      }
    } catch (ex) {}
    if (button) {
      const isActive = lodash.some(activeButtons, { x, y });

      let color = isActive ? lodash.get(button, 'activeColor', button.color) : button.color

      const btnIdx = XYToButton(x, y);
      switch (color.mode) {
        case LaunchpadButtonColorMode.Static:
          solids.push(btnIdx, (color as LaunchpadSolidButtonColor).color);
          break;
        case LaunchpadButtonColorMode.Flashing:
          solids.push(btnIdx, (color as LaunchpadFlashingButtonColor).color)
          flashing.push(0, btnIdx, (color as LaunchpadFlashingButtonColor).alt);
          break;
        case LaunchpadButtonColorMode.Pulsing:
          pulsing.push(0, btnIdx, (color as LaunchpadPulsingButtonColor).color)
          break;
        case LaunchpadButtonColorMode.RGB:
          const { r, g, b } = (color as LaunchpadRGBButtonColor).getRGB();
          rgb.push(btnIdx, Math.floor(r / 4), Math.floor(g / 4), Math.floor(b / 4))
          break;
        default:
          solids.push(btnIdx, 0)
      }
    } else {
      // Clear the button or if its top right make it fade
      solids.push(XYToButton(x,y), 0)
    }
  }))
    // Set the whole board
  if (solids.length > 0) send(Vendor, [...Solid, ...solids]);
  if (flashing.length > 0) send(Vendor, [...Flashing, ...flashing]);
  if (pulsing.length > 0) send(Vendor, [...Pulsing, ...pulsing]);
  if (rgb.length > 0) send(Vendor, [...RGB, ...rgb]);
}

export const LaunchpadMK2: IPad = {
  name: "Launchpad MK2",
  type: ControllerType.Launchpad,
  initialize,
  unload, // will clear the board when switching
  buildColors,
  XYToButton,
  ButtonToXY,
  Component,
  limitedColor: false
}