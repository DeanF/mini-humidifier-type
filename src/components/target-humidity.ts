import { css, CSSResult, customElement, html, LitElement, property, TemplateResult } from 'lit-element';
import { PropertyValues } from 'lit-element/src/lib/updating-element';
import { TargetHumidity } from '../models/target-humidity';
import { StyleInfo, styleMap } from 'lit-html/directives/style-map';
import { TapAction } from '../types';
import { ActionHandlerEvent } from 'custom-card-helpers/dist';
import { handleClick } from '../utils/utils';

@customElement('mh-target-humidity')
export class HumidifierTargetHumidity extends LitElement {
  private _timer!: NodeJS.Timeout;

  @property() public targetHumidity!: TargetHumidity;
  @property() public sliderValue!: number;
  constructor() {
    super();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private _handleChange(e: any): Promise<unknown> {
    e.stopPropagation();
    this.sliderValue = e.target.value;

    const { entity } = this.targetHumidity;

    this.targetHumidity.change(this.sliderValue).then();

    if (this._timer) clearTimeout(this._timer);

    this._timer = setTimeout(async () => {
      if (this.targetHumidity.entity === entity) {
        this.sliderValue = this.targetHumidity.state;
        return this.requestUpdate('sliderValue');
      }
    }, this.targetHumidity.actionTimeout);

    return this.requestUpdate('sliderValue');
  }

  private _onIndicatorClick(ev: ActionHandlerEvent): void {
    ev.preventDefault();
    const indicator = this.targetHumidity.indicator;
    handleClick(this, indicator.hass, indicator.tapAction);
  }

  protected render(): TemplateResult | void {
    return html`
      <div class="mh-target_humidifier --slider flex">
        <ha-slider
          @change=${this._handleChange}
          @click=${(e: Event): void => e.stopPropagation()}
          min=${this.targetHumidity.min}
          max=${this.targetHumidity.max}
          step=${this.targetHumidity.step}
          value=${this.sliderValue}
          dir=${'ltr'}
          ignore-bar-touch
          pin
        >
        </ha-slider>
        ${this.renderIndicator()}
      </div>
    `;
  }

  private renderIndicatorIcon(): TemplateResult | void {
    const indicator = this.targetHumidity.indicator;
    if (!indicator.icon) return;
    const style = (indicator.iconStyle || {}) as StyleInfo;

    return html`
      <ha-icon style=${styleMap(style)} class="state__value_icon" .icon=${indicator.icon}> </ha-icon>
    `;
  }

  private renderIndicatorUnit(): TemplateResult | void {
    const indicator = this.targetHumidity.indicator;
    if (!indicator.unit) return;

    return html`
      <span class="state__uom ellipsis">${indicator.unit}</span>
    `;
  }

  private renderIndicator(): TemplateResult {
    if (this.targetHumidity.indicator.hide)
      return html`
        <div class="mh-target_humidifier__state"></div>
      `;

    const indicator = this.targetHumidity.indicator;
    const cls = indicator.tapAction.action !== TapAction.None ? 'pointer' : '';

    return html`
      <div class="mh-target_humidifier__state ${cls}" @click=${this._onIndicatorClick}>
        ${this.renderIndicatorIcon()}
        <span class="state__value ellipsis">${indicator.getValue(this.sliderValue)}</span>
        ${this.renderIndicatorUnit()}
      </div>
    `;
  }

  protected updated(changedProps: PropertyValues): void {
    if (changedProps.has('targetHumidity')) {
      this.sliderValue = this.targetHumidity.state;
    }
  }

  static get styles(): CSSResult {
    return css`
      :host {
        position: relative;
        box-sizing: border-box;
        min-width: 0;
        font-weight: var(--mh-info-font-weight);
      }
      .mh-target_humidifier.flex {
        display: flex;
        flex-direction: column-reverse;
        align-items: center;
        height: var(--mh-unit);
        width: 100%;
      }
      .mh-target_humidifier ha-slider {
        flex: 1;
        width: 100%;
        margin-top: calc(var(--mh-unit) * -0.35);
        line-height: normal;
      }
      .mh-target_humidifier__state {
        position: relative;
        display: flex;
        flex-wrap: nowrap;
        margin-top: calc(var(--mh-unit) * -0.1);
        height: calc(var(--mh-unit) * 0.45);
      }
      .state__value_icon {
        height: calc(var(--mh-unit) * 0.475);
        width: calc(var(--mh-unit) * 0.5);
        color: var(--mh-icon-color);
        --mdc-icon-size: calc(var(--mh-unit) * 0.5);
      }
      .state__value {
        font-size: calc(var(--mh-unit) * 0.35);
        line-height: calc(var(--mh-unit) * 0.475);
        margin: 0px 1px;
      }
      .state__uom {
        font-size: calc(var(--mh-unit) * 0.275);
        line-height: calc(var(--mh-unit) * 0.55);
        height: calc(var(--mh-unit) * 0.475);
        opacity: 0.8;
      }
    `;
  }
}
