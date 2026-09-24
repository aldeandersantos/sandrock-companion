import { Link } from 'react-router-dom';
import { Hammer } from 'lucide-react';
import type { CraftNode } from '../lib/types';
import { ItemArt } from './ui';

export function CraftTree({
  node,
  root = true,
}: {
  node: CraftNode;
  root?: boolean;
}) {
  return (
    <div className={root ? 'craft-tree' : 'tree-branch'}>
      <div className="tree-node">
        <ItemArt
          slug={node.item.slug}
          name={node.item.name}
          image={node.item.image_url}
        />
        <div>
          <Link to={`/items/${node.item.slug}`}>{node.item.name}</Link>
          {node.machine && (
            <small>
              <Hammer size={12} />
              {node.machine} · {node.batches} lote(s)
            </small>
          )}
          {node.produced_quantity > node.quantity && (
            <small>{node.produced_quantity - node.quantity} de sobra</small>
          )}
        </div>
        <span className="quantity">×{node.quantity}</span>
      </div>
      {node.ingredients.length > 0 && (
        <div className="tree-children">
          {node.ingredients.map((child, i) => (
            <CraftTree
              node={child}
              root={false}
              key={`${child.item.id}-${i}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
