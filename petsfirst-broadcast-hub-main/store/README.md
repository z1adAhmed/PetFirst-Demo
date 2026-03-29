# Redux Store Structure

This directory contains the Redux Toolkit store setup for the application.

## Structure

```
store/
├── index.ts                 # Store configuration and root reducer
├── hooks.ts                 # Typed Redux hooks (useAppDispatch, useAppSelector)
├── slices/                  # Redux slices (state management)
│   ├── configSlice.ts      # Meta config and template selection state
│   ├── broadcastSlice.ts   # Broadcast state and results
│   ├── templatesSlice.ts   # Template management state
│   └── uiSlice.ts          # UI state (modals, etc.)
└── thunks/                  # Async thunks (API calls)
    ├── templateThunks.ts    # Template-related async operations
    ├── broadcastThunks.ts   # Broadcast-related async operations
    └── mediaThunks.ts       # Media upload async operations
```

## Slices

### configSlice
Manages:
- Meta API configuration (accessToken, phoneNumberId, wabaId, etc.)
- Selected template
- Attachment ID
- Template name and language settings

### broadcastSlice
Manages:
- CSV data
- Broadcast results
- Broadcasting state (isBroadcasting, isTestBroadcasting)
- Current broadcast ID

### templatesSlice
Manages:
- Template list
- Loading states
- Template details
- Upload states
- Template selection map (uploaded images/media)
- Search query

### uiSlice
Manages:
- Modal state
- UI notifications

## Thunks

### templateThunks
- `fetchTemplates` - Fetches all message templates from Meta API
- `fetchTemplateDetailsThunk` - Fetches details for a specific template
- `fetchTemplateSelections` - Fetches previously uploaded template selections from Strapi

### broadcastThunks
- `sendMessage` - Sends a single WhatsApp message
- `executeBroadcast` - Executes a full broadcast to all contacts

### mediaThunks
- `uploadMediaToMeta` - Uploads media to Meta API
- `uploadStrapiFile` - Uploads file to Strapi
- `saveTemplateSelection` - Saves template selection to Strapi

## Usage

```typescript
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTemplateName } from '../store/slices/configSlice';
import { fetchTemplates } from '../store/thunks/templateThunks';

function MyComponent() {
  const dispatch = useAppDispatch();
  const templateName = useAppSelector((state) => state.config.config.templateName);
  
  useEffect(() => {
    dispatch(fetchTemplates({ accessToken, wabaId, apiVersion }));
  }, [dispatch]);
  
  const handleChange = (name: string) => {
    dispatch(setTemplateName(name));
  };
}
```
