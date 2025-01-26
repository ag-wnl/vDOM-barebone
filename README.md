# vDOM Barebone

A virtual DOM implementation with static analysis for efficient reconciliation. Experimental.

## Features

- Fine grain diffing - Static analysis with render, mount, patch methods
- Ability to attach event listeners to element (Yes! you can update the count state on click ⚡)
- Way faster than react reconciliation if you have majority static and lesser number of dynamic components

## Lessons Learned

Walking on trees is important. But looking at the tree might be
a better idea.

## Acknowledgements

- [Aiden Bai's million.js barebones](https://github.com/aidenybai/million)
- [Blockdom](https://github.com/ged-odoo/blockdom)
