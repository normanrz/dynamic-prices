function NumericInput({ value, label, onChange }) {
  return <div className="form-group col-md-3">
    <div className="input-group">
      <span className="input-group-addon">{label}</span>
      <input
        type="text"
        className="form-control"
        value={value}
        onChange={e => { onChange(parseFloat(e.target.value)); }}
      />
    </div>
  </div>;
}

function range(n) {
  return Array.apply(null, Array(n)).map((_, i) => i);
}

class OptionsForm extends React.Component {

  constructor() {
    super();
    this.state = {
      T: 20,
      N: 20,
      L: 1,
      delta: 0.99,
      Z: 1,
      price_min: 10,
      price_max: 20,
      price_step: 0.1,
      competitors: [11, 13, 14, 16, 18],
      coef: range(6).map(() => Math.random()),
      counts: 100,
    };
  }

  makeChangeHandler(path) {
    return (value) => {
      if (Array.isArray(path)) {
        let copy = this.state[path[0]].slice(0);
        copy[path[1]] = value;
        this.setState({ [path[0]]: copy });
      } else {
        this.setState({ [path]: value });
      }
    }
  }


  render() {
    return <form onSubmit={e => { e.preventDefault(); this.props.onSubmit(this.state); }}>
      <div className="row">
        <NumericInput 
          label="Items (N)"
          value={this.state.N}
          onChange={this.makeChangeHandler('N')}
        />
        <NumericInput 
          label="Time (T)"
          value={this.state.T}
          onChange={this.makeChangeHandler('T')}
        />
        <NumericInput 
          label="Salvage Profit (Z)"
          value={this.state.Z}
          onChange={this.makeChangeHandler('Z')}
        />
        <NumericInput 
          label="Storage Cost (L)"
          value={this.state.L}
          onChange={this.makeChangeHandler('L')}
        />
        <NumericInput 
          label="Discount Factor (Δ)"
          value={this.state.delta}
          onChange={this.makeChangeHandler('delta')}
        />
        <NumericInput 
          label="Min. Price"
          value={this.state.price_min}
          onChange={this.makeChangeHandler('price_min')}
        />
        <NumericInput 
          label="Max. Price"
          value={this.state.price_max}
          onChange={this.makeChangeHandler('price_max')}
        />
        <NumericInput 
          label="Price Steps"
          value={this.state.price_step}
          onChange={this.makeChangeHandler('price_step')}
        />
      </div>
      <div className="row">
        {
          this.state.coef.map((coef, i) => 
            <NumericInput
              key={i}
              label={'C' + i}
              value={coef}
              onChange={this.makeChangeHandler(['coef', i])}
            />
          )
        }
      </div>
      <div className="row">
        {
          this.state.competitors.map((cp, i) => 
            <NumericInput 
              key={i}
              label={'Competitor ' + (i + 1)}
              value={cp}
              onChange={this.makeChangeHandler(['competitors', i])}
            />
          )
        }
      </div>
      <div className="row">
        <div className="col-md-1 col-md-offset-8">
          <button type="submit" className="btn btn-default">Submit</button>
        </div>
      </div>
    </form>;
  }
}

window.OptionsForm = OptionsForm;