import { API } from '../../../../API'
import { BootOpt } from '../../../../system'
import { Style, Tag } from '../../../../system/platform/Style'
import { LayoutNode } from '../../../LayoutNode'
import { RGBA, colorToHex, hexToRgba } from '../../../color'
import { parseTransform } from '../../../parseTransform'
import { applyStyle } from '../../../style'
import { parseFontSize } from '../../../util/style/getFontSize'
import { parseOpacity } from '../../../util/style/getOpacity'

export const isTextName = (tag: string) => {
  return ['text', 'path'].includes(tag)
}

export const isSVGName = (tag: string) => {
  return ['path', 'rect', 'circle', 'line', 'ellipse'].includes(tag)
}

const fitChildren = (
  window: Window,
  parentTrait: LayoutNode,
  parentNode: HTMLElement,
  children: Tag[],
  path: number[],
  childrenFontSize: number[],
  childrenOpacity: number[],
  childrenSx: number[],
  childrenSy: number[],
  expandChild: (path: number[]) => Tag[]
) => {
  let i = 0

  for (const { name, style, textContent } of children) {
    let tag = name.replace('#', '').toLocaleLowerCase()

    tag = isTextName(tag) || isSVGName(tag) ? 'div' : tag

    const childNode = window.document.createElement(tag)

    childNode.textContent = textContent

    let {
      display: childDisplay = 'block',
      width: childWidthStr = 'auto',
      height: childHeightStr = 'auto',
      opacity: childOpacityStr = '1',
      transform: childTransform = '',
    } = style

    const childFontSize = style['fontSize'] ?? style['font-size']

    let childFontSizeStr = childFontSize

    if (typeof childFontSize === 'number') {
      childFontSizeStr = `${childFontSizeStr}px`
    }

    const [
      childTransformX,
      childTransformY,
      childScaleX,
      childScaleY,
      childRotateX,
      childRotateY,
      childRotateZ,
    ] = parseTransform(childTransform, parentTrait.width, parentTrait.height)

    const childOpacity = parseOpacity(childOpacityStr)

    let fontSize =
      (childFontSizeStr && parseFontSize(childFontSizeStr)) ||
      parentTrait.fontSize

    const fontSizeUnit = childFontSizeStr?.match(/(px|em|rem|pt|vw|vh|%)$/)?.[1]

    if (fontSizeUnit === 'vw') {
      fontSize *= parentTrait.width / 100
    }

    if (fontSizeUnit === 'vh') {
      fontSize *= parentTrait.height / 100
    }

    const sx = parentTrait.sx * childScaleX
    const sy = parentTrait.sy * childScaleY

    const displayContents = childDisplay === 'contents'
    const fitWidth = childWidthStr === 'fit-content' || childWidthStr === 'auto'
    const fitHeight =
      childHeightStr === 'fit-content' || childHeightStr === 'auto'

    const shouldExpand = fitWidth || fitHeight || displayContents

    if (shouldExpand) {
      const childPath = [...path, i]

      const childChildrenStyle = expandChild(childPath)

      childNode.textContent = ''

      fitChildren(
        window,
        { ...parentTrait, fontSize },
        childNode,
        childChildrenStyle,
        childPath,
        [],
        [],
        [],
        [],
        expandChild
      )
    }

    childrenFontSize.push(fontSize)
    childrenOpacity.push(childOpacity)
    childrenSx.push(sx)
    childrenSy.push(sy)

    applyStyle(childNode, style)

    parentNode.appendChild(childNode)

    i++
  }
}

export function webLayout(window: Window, opt: BootOpt): API['layout'] {
  const animation: API['layout'] = {
    reflectChildrenTrait: function (
      parentTrait: LayoutNode,
      parentStyle: Style,
      childrenStyle: Tag[],
      expandChild: (path: number[]) => Tag[]
    ): LayoutNode[] {
      const parentNode = window.document.createElement('div')

      applyStyle(parentNode, parentStyle)

      parentNode.style.position = 'absolute'
      parentNode.style.left = `${parentTrait.x}px`
      parentNode.style.top = `${parentTrait.y}px`
      parentNode.style.width = parentStyle.width?.endsWith('px')
        ? parentStyle.width
        : `${parentTrait.width}px`
      parentNode.style.height = parentStyle.height?.endsWith('px')
        ? parentStyle.height
        : `${parentTrait.height}px`
      // parentNode.style.transform = `scale(${parentTrait.sx}, ${parentTrait.sy})`
      parentNode.style.transform = ``
      parentNode.style.fontSize = `${parentTrait.fontSize}px`
      parentNode.style.visibility = 'hidden'
      parentNode.style.margin = '0'

      const childrenFontSize: number[] = []
      const childrenOpacity: number[] = []
      const childrenSx: number[] = []
      const childrenSy: number[] = []

      fitChildren(
        window,
        parentTrait,
        parentNode,
        childrenStyle,
        [],
        childrenFontSize,
        childrenOpacity,
        childrenSx,
        childrenSy,
        expandChild
      )

      window.document.body.appendChild(parentNode)

      const childrenTrait: LayoutNode[] = []

      for (let i = 0; i < childrenStyle.length; i++) {
        const childStyle = childrenStyle[i]
        const childFontSize = childrenFontSize[i]
        const childOpacity = childrenOpacity[i]
        const childSx = childrenSx[i]
        const childSy = childrenSy[i]

        const childNode = parentNode.children.item(i) as HTMLElement

        const rect = childNode.getBoundingClientRect()

        const computedStyle = window.getComputedStyle(childNode)

        let x = rect.x
        let y = rect.y

        let color: RGBA

        if (
          computedStyle.color &&
          computedStyle.color !== 'rgb(255, 255, 255)'
        ) {
          const hex: string = colorToHex(computedStyle.color)

          color = (hex && hexToRgba(hex)) || parentTrait.color
        } else {
          color = parentTrait.color
        }

        const childTrait: LayoutNode = {
          x,
          y,
          width: rect.width,
          height: rect.height,
          opacity: childOpacity,
          fontSize: childFontSize,
          sx: childSx,
          sy: childSy,
          color,
        }

        childrenTrait.push(childTrait)
      }

      window.document.body.removeChild(parentNode)

      return childrenTrait
    },
  }

  return animation
}
