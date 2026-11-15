type BrandProps = { light?: boolean }

export function Brand({ light = false }: BrandProps) {
  return (
    <div className={`brand ${light ? 'brand-light' : ''}`}>
      <span className="brand-mark" aria-hidden="true">P</span>
      <span>
        PPC
        <small>Ponto Pet Comunitário</small>
      </span>
    </div>
  )
}