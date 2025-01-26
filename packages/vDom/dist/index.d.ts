interface VElement {
    type: string;
    props: Props;
    children: VNode[];
}
type VNode = VElement | string;
type Props = Record<string, any>;
interface EditAttribute {
    type: "attribute";
    path: number[];
    attribute: string;
    hole: string;
}
interface EditText {
    type: "child";
    path: number[];
    index: number;
    hole: string;
}
type Edit = EditAttribute | EditText;
interface Block {
    props: Props;
    edits: Edit[];
    mount: (parent: HTMLElement) => void;
    patch: (newBlock: Block) => void;
}

/**
 * @reference https://github.com/aidenybai/hundred#readme
 */
declare const h: (type: string, props?: Props, ...children: VNode[]) => VElement;
/**
 * @description helps create a mapping between props and virtual nodes. This is done by the
 * Proxy - which we use to intercept any property access and create our mapping
 *
 * We track which properties are accessed and create a mapping between the property name and the hole
 *
 * @param fn : (props: Props) => VNode. User provides a func which takes props
 * @returns generated virtual dom node, based on the props
 */
declare const block: (fn: (props: Props) => VNode) => (props: Props) => Block;
/**
 * @description renders the virtual dom node to the DOM
 * If the node has children, we recursively render each child (dfs into the tree)
 *
 * We also do static analysis in order to determine where edits are
 * required to be made
 *
 * @param vnode : virtual dom node
 * @param edits : list of edits to be made to the dom. Edit represents a mapping between a hole and the value
 * each Edit has data where the relevant DOM node is in the tree, key to access the props via hole
 * and property name we wan to update (via name if it's an attribute, or index if it's a child)
 *
 * @returns HTMLElement | Text
 */
declare const render: (vnode: VNode, edits?: Edit[], path?: number[]) => HTMLElement | Text;

export { block, h, render };
