/* Forms.tsx
 * ================
 *
 * Reusable React components to keep admin form code succint and consistent
 */

import * as React from 'react'
import { extend, numberOnly, pick, omit, guid } from '../charts/Util'
import { bind } from 'decko'

const MDButton = require('preact-material-components/Button').default
const Select = require('preact-material-components/Select').default
const Formfield = require('preact-material-components/Formfield').default

const MDCTextfield = require('@material/textfield').MDCTextfield


import { FormControlLabel } from 'material-ui/Form'
import Checkbox from 'material-ui/Checkbox'
import MTextField from 'material-ui/TextField'
import Switch from 'material-ui/Switch';

export interface TextFieldProps extends React.HTMLAttributes<HTMLLabelElement> {
    label?: string,
    value: string | undefined,
    onValue: (value: string | undefined) => void,
    onEnter?: () => void,
    onEscape?: () => void,
    placeholder?: string,
    title?: string,
    disabled?: boolean,
    helpText?: string,
    fullWidth?: boolean
}

export class TextField extends React.Component<TextFieldProps> {
    @bind onInput(ev: React.FormEvent<HTMLInputElement>) {
        const value = ev.currentTarget.value
        if (value === "") {
            this.props.onValue(undefined)
        } else {
            this.props.onValue(value)
        }
    }

    @bind onKeyDown(ev: React.KeyboardEvent<HTMLInputElement>) {
        if (ev.key === "Enter" && this.props.onEnter) {
            this.props.onEnter()
        } else if (ev.key === "Escape" && this.props.onEscape) {
            this.props.onEscape()
        }
    }

    id: string
    componentWillMount() {
        this.id = `textfield-${guid()}`
    }

    render() {
        const { props } = this
        const passthroughProps = pick(props, ['title', 'disabled'])

        return <MTextField fullWidth label={props.label} value={props.value} onChange={e => this.props.onValue(e.currentTarget.value)} helperText={props.helpText}/>

        return <div style={extend({display: "inline-block"}, props.style||{})}>
            <div className="mdc-textfield mdc-textfield--dense" style={{ width: "100%" }} {...passthroughProps}>
                <input type="text" id={this.id} className="mdc-textfield__input" onInput={this.onInput} value={props.value}/>
                <label htmlFor={this.id} className="mdc-textfield__label">{props.label}</label>
                <div className="mdc-textfield__bottom-line"></div>
            </div>
            {props.helpText && <p id={`${this.id}-helptext`} className="mdc-textfield-helptext mdc-textfield-helptext--persistent" aria-hidden={true}>
                {props.helpText}
            </p>}
        </div>

        //return <MDTextField label={props.label} value={props.value} onInput={this.onInput} placeholder={props.placeholder} {...passthroughProps} />
        /*if (props.label) {
            return <label className="TextField" style={props.style}>
                {props.label}
                <input className="form-control" type="text" value={props.value} onInput={this.onInput} onKeyDown={this.onKeyDown} {...passthroughProps} />
            </label>
        } else {
            return <input style={props.style} className="TextField form-control" type="text" value={props.value} onInput={this.onInput} onKeyDown={this.onKeyDown} {...passthroughProps} />
        }*/
    }
}

export class TextAreaField extends React.Component<TextFieldProps> {
    @bind onInput(ev: React.FormEvent<HTMLTextAreaElement>) {
        const value = ev.currentTarget.value
        if (value === "") {
            this.props.onValue(undefined)
        } else {
            this.props.onValue(value)
        }
    }

    base: HTMLDivElement
    componentDidMount() {
        MDCTextfield.attachTo(this.base)
    }

    render() {
        const { props } = this
        const passthroughProps = pick(props, ['placeholder', 'title', 'disabled', 'label', 'helpText'])


        return <div className="mdc-textfield mdc-textfield--textarea mdc-textfield--dense">
            <textarea id="textarea" className="mdc-textfield__input" rows={6} cols={60} value={props.value} onInput={this.onInput}></textarea>
            <label htmlFor="textarea" className="mdc-textfield__label">{props.label}</label>
        </div>
        //return <MDTextField fullwidth={true} value={props.value} onInput={this.onInput} {...passthroughProps}/>
        /*if (props.label) {
            return <label style={props.style} className="TextAreaField">
                {props.label}
                <textarea className="form-control" value={props.value} onInput={this.onInput} {...passthroughProps} />
            </label>
        } else {
            return <textarea className="TextAreaField form-control" style={props.style} value={props.value} onInput={this.onInput} {...passthroughProps} />
        }*/
    }
}

export interface NumberFieldProps {
    label?: string,
    value: number | undefined,
    onValue: (value: number | undefined) => void,
    min?: number,
    max?: number,
    placeholder?: string
    disabled?: boolean
}

export class NumberField extends React.Component<NumberFieldProps> {
    render() {
        const { props } = this
        return <TextField value={props.value !== undefined ? props.value.toString() : undefined} onValue={v => props.onValue(numberOnly(v))} {...omit(props, ['value', 'onValue'])}/>
    }
}

export interface SelectFieldProps {
    label: string,
    value: string | undefined,
    onValue: (value: string | undefined) => void,
    options: string[],
    optionLabels?: string[]
}

export class SelectField extends React.Component<SelectFieldProps> {
    render() {
        const { props } = this

        return <Formfield>
            <label>{props.label}</label> <Select selectedIndex={props.value ? props.options.indexOf(props.value) : undefined} onChange={(e: any) => props.onValue(props.options[e.selectedIndex])}>
                {props.options.map((value, i) =>
                    <Select.Item>{props.optionLabels ? props.optionLabels[i] : value}</Select.Item>
                )}
            </Select>
         </Formfield>
    }
}

export interface NumericSelectFieldProps {
    label?: string,
    value?: number,
    onValue: (value: number) => void,
    options: number[],
    optionLabels: string[]
}

export class NumericSelectField extends React.Component<NumericSelectFieldProps> {
    onChange(ev: React.FormEvent<HTMLSelectElement>) {
        this.props.onValue(parseFloat(ev.currentTarget.value))
    }

    render() {
        const { props } = this
        return <label>
            {props.label}
            <select className="form-control" value={props.value}>
                {props.options.map((value, i) =>
                    <option value={value}>{props.optionLabels[i]}</option>
                )}
            </select>
        </label>
    }
}

export interface ToggleProps {
    label?: string,
    value: boolean,
    onValue: (value: boolean) => void
}

export class Toggle extends React.Component<ToggleProps> {
    render() {
        const { props } = this
        /*return <div className="mdc-form-field">

        </div>*/

        if (!props.label) {
            return <Switch checked={props.value} onChange={(_, isChecked) => props.onValue(isChecked)}/>
        } else {
            const checkbox = <Checkbox checked={props.value} onChange={(_, isChecked) => props.onValue(isChecked)}/>
            return <FormControlLabel label={props.label} control={checkbox}/>
        }
        /* return <FormField>
             <Checkbox checked={props.value} onChange={(ev) => props.onValue(ev.target.checked)}/> <label>{props.label}</label>
         </FormField>
         return <label className="Toggle clickable">
             <input type="checkbox" checked={props.value}  />
             {" " + props.label}
         </label>*/
    }
}

export interface ButtonProps {
    onClick: () => void,
    label: string
}

export class Button extends React.Component<ButtonProps> {
    render() {
        const {props} = this
        return <MDButton onClick={props.onClick}>{props.label}</MDButton>
    }
}