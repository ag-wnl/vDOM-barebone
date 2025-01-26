import { Block, Edit, Props, VElement, VNode } from "./types";

/**
 * @reference https://github.com/aidenybai/hundred#readme
 */

// Helper function to create virtual dom nodes
// e.g. h('div', { id: 'foo' }, 'hello') => <div id="foo">hello</div>

// console.log(h("div", { id: "foo" }, "hello"));
// gives us { type: 'div', props: { id: 'foo' }, children: ['hello'] }

// console.log(h("div", { id: "foo" }, h("span", {}, "hello")));
// gives us { type: 'div', props: { id: 'foo' }, children: [{ type: 'span', props: null, children: ['hello'] }] }
export const h = (
  type: string,
  props: Props = {},
  ...children: VNode[]
): VElement => ({
  type,
  props,
  children,
});

/**
 * @description Hole is a placeholder for a value that will be filled in later
 * helps in static analysis as we can just assign a value to a hole - essentially making it reactive
 *
 * @param key: propety name that was accessed (captured by our Proxy interceptor)
 */
class Hole {
  key: string;
  constructor(key: string) {
    this.key = key;
  }
}

/**
 * @description helps create a mapping between props and virtual nodes. This is done by the
 * Proxy - which we use to intercept any property access and create our mapping
 *
 * We track which properties are accessed and create a mapping between the property name and the hole
 *
 * @param fn : (props: Props) => VNode. User provides a func which takes props
 * @returns generated virtual dom node, based on the props
 */
export const block = (fn: (props: Props) => VNode) => {
  const proxy = new Proxy(
    {},
    {
      // we intercept any prop access, and return the hole value instead
      get(_, prop: string) {
        return new Hole(prop);
      },
    }
  );

  // function call with proxy as the prop (so our interception can work):
  const vnode = fn(proxy);

  // edits is a mutable array, so we pass it by reference
  const edits: Edit[] = [];
  // by rendering the vnode, we also populate the edits array
  const root = render(vnode, edits);

  // factory function to create instances of this block
  return (props: Props): Block => {
    // elements stores the element references for each edit
    // during mount, which can be used during patch later
    const elements = new Array(edits.length);

    // mount puts the element for the block on some parent element
    const mount = (parent: HTMLElement) => {
      // cloneNode saves memory by not reconstrcuting the dom tree
      const el = root.cloneNode(true);
      // we assume our rendering scope is just one block
      parent.textContent = "";
      parent.appendChild(el);

      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];

        /**
         * Now we will be walking the tree to find the element / hole
         * Ex: If path = [1, 2, 3]
         * thisEl = el.childNodes[1].childNodes[2].childNodes[3]
         *
         * We start with thisEl = el, as the element is the root parent and
         * then we walk the tree using the path to reach the element
         */
        let thisEl = el;
        for (let i = 0; i < edit.path.length; i++) {
          thisEl = thisEl.childNodes[edit.path[i]];
        }

        // make sure we save the element reference
        elements[i] = thisEl;

        // this time, we can get the value from props
        const value = props[edit.hole];

        if (edit.type === "attribute") {
          // @ts-ignore
          thisEl[edit.attribute] = value;
        } else if (edit.type === "child") {
          // if the value is a block, mount it (this means we have a nested block)
          if (value.mount && typeof value.mount === "function") {
            value.mount(thisEl);
          } else {
            // else insert a text node at the specified index
            const textNode = document.createTextNode(value);
            thisEl.insertBefore(textNode, thisEl.childNodes[edit.index]);
          }
        }
      }
    };

    // patch updates the element references with new values
    const patch = (newBlock: Block) => {
      for (let i = 0; i < edits.length; i++) {
        const edit = edits[i];
        const value = props[edit.hole];
        const newValue = newBlock.props[edit.hole];

        // dirty check
        if (value === newValue) continue;

        const thisEl = elements[i];

        if (edit.type === "attribute") {
          thisEl[edit.attribute] = newValue;
        } else if (edit.type === "child") {
          // handle nested blocks if the value is a block
          if (value.patch && typeof value.patch === "function") {
            // patch corresponding child blocks
            value.patch(newBlock.edits[i].hole);
          } else {
            thisEl.childNodes[edit.index].textContent = newValue;
          }
        }
      }
    };

    return { mount, patch, props, edits };
  };
};

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
 * Ex of edits:
 * [
  {
    type: 'attribute',
    path: [0, 1], // Path to the element
    attribute: 'class', // Attribute to update
    hole: 'className', // Key to look up the value in props
  },
  {
    type: 'child',
    path: [0], // Path to the parent element
    index: 2, // Position of the child in the parent
    hole: 'text', // Key to look up the value in props
  },
  ]
 *
 * @returns HTMLElement | Text
 */
export const render = (
  // represents a virtual dom node, built w/ `h` function
  vnode: VNode,
  // represents a list of edits to be made to the dom,
  // processed by identifying `Hole` placeholder values
  // in attributes and children.
  //    NOTE: this is a mutable array, and we assume the user
  //    passes in an empty array and uses that as a reference
  //    for the edits.
  edits: Edit[] = [],
  /**
   * Path is used to keep track of where we are in the tree.
   * An array of indices that represents the position of an element in the DOM tree.
   *
   * For example, [0, 1, 2] means:
   * - Start at the root element
   * - Go to the 1st child (index 0)
   * - Go to the 2nd child of that child (index 1)
   * - Go to the 3rd child of that child (index 2)
   *
   * e.g. [0, 1, 2] would mean:
   *    el1 = 1st child of el
   *    el2 = 2nd child of el1
   *    el3 = 3rd child of el2
   */
  path: number[] = []
): HTMLElement | Text => {
  if (typeof vnode === "string") return document.createTextNode(vnode);

  const el = document.createElement(vnode.type);

  if (vnode.props) {
    for (const name in vnode.props) {
      const value = vnode.props[name];
      if (value instanceof Hole) {
        edits.push({
          type: "attribute",
          path, // path to the element
          attribute: name, // attribute to update during mount/patch
          hole: value.key, // key to look up the value in props during mount/patch
        });
      } else {
        // @ts-ignore
        el[name] = value; // set the attribute directly if it's not a Hole
      }
    }
  }

  for (let i = 0; i < vnode.children?.length; i++) {
    const child = vnode.children[i];
    if (child instanceof Hole) {
      // mark the child as a hole so in future we can dynamically insert/update the child
      edits.push({
        type: "child",
        path, // path to the parent element
        index: i, // index represents the position of the child in the parent. Used to insert/update the child during mount/patch
        hole: child.key, // key to look up the value in props during mount/patch
      });
    } else {
      // we respread the path to avoid mutating the original array
      el.appendChild(render(child, edits, [...path, i]));
    }
  }

  return el;
};
