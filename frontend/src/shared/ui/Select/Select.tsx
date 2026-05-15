import * as RadixSelect from '@radix-ui/react-select'
import { Check, ChevronDown } from 'lucide-react'
import {
  Children,
  forwardRef,
  isValidElement,
  useMemo,
  type ChangeEvent,
  type OptionHTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/shared/lib/cn'
import styles from './Select.module.css'

interface SelectOption {
  value: string
  label: ReactNode
  disabled: boolean
}

interface SelectProps {
  id?: string | undefined
  name?: string | undefined
  value?: string | number | readonly string[] | undefined
  disabled?: boolean | undefined
  required?: boolean | undefined
  className?: string | undefined
  'aria-label'?: string | undefined
  error?: boolean
  wrapperClassName?: string | undefined
  selectClassName?: string | undefined
  icon?: ReactNode
  onChange?: ((event: ChangeEvent<HTMLSelectElement>) => void) | undefined
  children: ReactNode
}

const EMPTY_VALUE = '__empty__'

function extractOptions(children: ReactNode): SelectOption[] {
  return Children.toArray(children).flatMap((child) => {
    if (
      !isValidElement<OptionHTMLAttributes<HTMLOptionElement>>(child) ||
      child.type !== 'option'
    ) {
      return []
    }

    return [
      {
        value: String(child.props.value ?? ''),
        label: child.props.children,
        disabled: Boolean(child.props.disabled),
      },
    ]
  })
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    error = false,
    wrapperClassName,
    selectClassName,
    icon = <ChevronDown size={13} />,
    className,
    disabled,
    value,
    onChange,
    name,
    required,
    id,
    'aria-label': ariaLabel,
    children,
  },
  ref,
) {
  const options = useMemo(() => extractOptions(children), [children])
  const normalizedValue = String(value ?? '')
  const radixValue = normalizedValue === '' ? EMPTY_VALUE : normalizedValue
  const selectedOption =
    options.find((option) => option.value === normalizedValue) ??
    options.find((option) => option.value === '') ??
    options[0]

  return (
    <div className={cn(styles.wrap, wrapperClassName, className)}>
      <input type="hidden" name={name} value={normalizedValue} required={required} />
      <RadixSelect.Root
        value={radixValue}
        disabled={Boolean(disabled)}
        onValueChange={(nextValue) => {
          const resolvedValue = nextValue === EMPTY_VALUE ? '' : nextValue
          onChange?.({
            target: { value: resolvedValue },
            currentTarget: { value: resolvedValue },
          } as ChangeEvent<HTMLSelectElement>)
        }}
      >
        <RadixSelect.Trigger
          ref={ref}
          id={id}
          aria-label={ariaLabel}
          className={cn(
            styles.select,
            error && styles.error,
            disabled && styles.disabled,
            selectClassName,
          )}
        >
          <RadixSelect.Value className={styles.value}>
            {selectedOption?.label ?? null}
          </RadixSelect.Value>
          <RadixSelect.Icon className={styles.icon}>{icon}</RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            className={styles.content}
            position="popper"
            sideOffset={4}
            align="start"
          >
            <RadixSelect.Viewport className={styles.viewport}>
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value || EMPTY_VALUE}
                  value={option.value === '' ? EMPTY_VALUE : option.value}
                  disabled={option.disabled}
                  className={styles.option}
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className={styles.check}>
                    <Check size={12} />
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  )
})
